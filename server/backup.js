// backup.js
// Usage:
//  node backup.js once                => buat 1x backup lalu exit
//  node backup.js daemon              => jalankan scheduler sesuai BACKUP_CRON env (default: "0 2 * * *")
//  BACKUP_CRON="0 2 * * *" node backup.js daemon  (linux/mac)
//  Windows (cmd): set "BACKUP_CRON=0 2 * * *" && node backup.js daemon

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const DB_NAME = process.env.DB_NAME || 'inventory.db';
const DB_PATH = path.join(__dirname, DB_NAME);
const BACKUP_DIR = path.join(__dirname, 'backups');
const KEEP = parseInt(process.env.BACKUP_KEEP || '7', 10); // keep last N backups
const CRON_EXPR = process.env.BACKUP_CRON || '0 2 * * *'; // default tiap 02:00

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function backupOnce() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(DB_PATH)) return reject(new Error(`Database not found: ${DB_PATH}`));
      ensureDir(BACKUP_DIR);
      const name = `inventory-${timestamp()}.db`;
      const dest = path.join(BACKUP_DIR, name);

      // copy file
      const rd = fs.createReadStream(DB_PATH);
      const wr = fs.createWriteStream(dest);
      rd.on('error', reject);
      wr.on('error', reject);
      wr.on('close', () => {
        // cleanup old backups
        cleanupOld().then(() => resolve(dest)).catch(reject);
      });
      rd.pipe(wr);
    } catch (err) {
      reject(err);
    }
  });
}

async function cleanupOld() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('inventory-') && f.endsWith('.db'))
      .map(f => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a,b) => b.t - a.t); // newest first

    if (files.length <= KEEP) return;

    const toDelete = files.slice(KEEP);
    toDelete.forEach(it => {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, it.f));
      } catch (e) {
        console.warn('Failed to remove old backup', it.f, e.message);
      }
    });
  } catch (err) {
    console.warn('cleanupOld error', err.message);
  }
}

async function startDaemon() {
  console.log('Backup daemon starting. CRON:', CRON_EXPR, 'DB:', DB_PATH, 'KEEP:', KEEP);
  // schedule
  if (!cron.validate(CRON_EXPR)) {
    console.error('Invalid cron expression:', CRON_EXPR);
    process.exit(1);
  }
  cron.schedule(CRON_EXPR, async () => {
    console.log(new Date().toISOString(), 'Running scheduled backup...');
    try {
      const p = await backupOnce();
      console.log('Backup saved to', p);
    } catch (err) {
      console.error('Backup error:', err.message);
    }
  }, { timezone: process.env.BACKUP_TZ || undefined });

  // also do a backup at startup once (optional)
  try {
    const p = await backupOnce();
    console.log('Initial backup saved to', p);
  } catch (err) {
    console.warn('Initial backup failed:', err.message);
  }
}

async function main() {
  const mode = process.argv[2] || 'daemon';
  if (mode === 'once') {
    try {
      const p = await backupOnce();
      console.log('Backup created:', p);
      process.exit(0);
    } catch (err) {
      console.error('Backup failed:', err.message);
      process.exit(2);
    }
  } else if (mode === 'daemon') {
    await startDaemon();
    // keep process alive
    process.stdin.resume();
  } else {
    console.error('Unknown mode. Use "once" or "daemon".');
    process.exit(1);
  }
}

main();
