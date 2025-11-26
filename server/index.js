// index.js
// Server Inventaris IT + Auth Sederhana (JWT)
//
// Jalankan lokal:  node index.js
// Di Render: PORT akan diisi otomatis lewat process.env.PORT

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// >>> PERUBAHAN PENTING UNTUK RENDER <<<
const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || 'ganti_ini_dengan_secret_yang_lebih_sulit';

// ====== MIDDLEWARE GLOBAL ======
app.use(cors()); // kalau mau dibatasi asalnya, nanti bisa pakai origin: [...]
app.use(express.json());

// ====== KONEKSI DATABASE ======
const dbPath = path.join(__dirname, 'inventory.db'); // sesuaikan jika beda
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal konek ke SQLite:', err.message);
  } else {
    console.log('Terhubung ke SQLite:', dbPath);
  }
});

// ====== BUAT TABEL JIKA BELUM ADA ======
db.serialize(() => {
  // Tabel Items
  db.run(
    `CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL
    )`,
    (err) => {
      if (err) console.error('Error create items:', err.message);
    }
  );

  // Tabel Transactions
  db.run(
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN','OUT')),
      itemId TEXT NOT NULL,
      itemName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT
    )`,
    (err) => {
      if (err) console.error('Error create transactions:', err.message);
    }
  );

  // Tabel Users
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    )`,
    (err) => {
      if (err) console.error('Error create users:', err.message);
    }
  );

  // Cek apakah sudah ada user, kalau belum buat default admin
  db.get('SELECT COUNT(*) AS count FROM users', async (err, row) => {
    if (err) {
      console.error('Error check users:', err.message);
      return;
    }
    if (row.count === 0) {
      const defaultUser = 'admin';
      const defaultPass = 'admin123';
      const hash = await bcrypt.hash(defaultPass, 10);
      db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [defaultUser, hash, 'admin'],
        (err2) => {
          if (err2) {
            console.error('Error create default admin:', err2.message);
          } else {
            console.log(
              `User default dibuat: username = ${defaultUser}, password = ${defaultPass}`
            );
          }
        }
      );
    }
  });
});

// ====== HELPER AUTH ======
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan.' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // {id, username, role}
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Token tidak valid atau kadaluarsa.' });
  }
}

// ====== ROUTES AUTH ======

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username dan password wajib diisi.' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        console.error('Error query user:', err.message);
        return res.status(500).json({ message: 'Terjadi kesalahan server.' });
      }
      if (!user) {
        return res
          .status(401)
          .json({ message: 'Username atau password salah.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(401)
          .json({ message: 'Username atau password salah.' });
      }

      const token = generateToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    }
  );
});

// (Opsional) cek profil user dari token
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ====== ROUTES ITEMS (semua diproteksi authMiddleware) ======
app.get('/api/items', authMiddleware, (req, res) => {
  db.all('SELECT * FROM items ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      console.error('Error get items:', err.message);
      return res
        .status(500)
        .json({ message: 'Gagal mengambil data items.' });
    }
    res.json(rows);
  });
});

app.post('/api/items', authMiddleware, (req, res) => {
  const { id, name, stock, unit } = req.body || {};
  if (!id || !name || unit == null) {
    return res
      .status(400)
      .json({ message: 'ID, name, dan unit item wajib diisi.' });
  }

  db.run(
    'INSERT INTO items (id, name, stock, unit) VALUES (?, ?, ?, ?)',
    [id, name, Number(stock || 0), unit],
    (err) => {
      if (err) {
        console.error('Error insert item:', err.message);
        return res.status(500).json({ message: 'Gagal menambah item.' });
      }
      res.json({ message: 'Item berhasil ditambahkan.' });
    }
  );
});

app.put('/api/items/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, stock, unit } = req.body || {};
  db.run(
    'UPDATE items SET name = ?, stock = ?, unit = ? WHERE id = ?',
    [name, Number(stock || 0), unit, id],
    function (err) {
      if (err) {
        console.error('Error update item:', err.message);
        return res.status(500).json({ message: 'Gagal mengubah item.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Item tidak ditemukan.' });
      }
      res.json({ message: 'Item berhasil diperbarui.' });
    }
  );
});

app.delete('/api/items/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run('DELETE FROM transactions WHERE itemId = ?', [id], (err) => {
      if (err) {
        console.error('Error delete item transactions:', err.message);
      }
    });
    db.run('DELETE FROM items WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('Error delete item:', err.message);
        return res.status(500).json({ message: 'Gagal menghapus item.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Item tidak ditemukan.' });
      }
      res.json({
        message: 'Item dan transaksi terkait berhasil dihapus.',
      });
    });
  });
});

// ====== ROUTES TRANSACTIONS ======
app.get('/api/transactions', authMiddleware, (req, res) => {
  db.all(
    'SELECT * FROM transactions ORDER BY date ASC, id ASC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error get transactions:', err.message);
        return res
          .status(500)
          .json({ message: 'Gagal mengambil data transaksi.' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/transactions', authMiddleware, (req, res) => {
  const { date, type, itemId, itemName, quantity, notes } = req.body || {};
  if (!date || !type || !itemId || !itemName || !quantity) {
    return res
      .status(400)
      .json({ message: 'Data transaksi belum lengkap.' });
  }

  db.run(
    'INSERT INTO transactions (date, type, itemId, itemName, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [date, type, itemId, itemName, Number(quantity), notes || ''],
    function (err) {
      if (err) {
        console.error('Error insert transaction:', err.message);
        return res
          .status(500)
          .json({ message: 'Gagal menyimpan transaksi.' });
      }
      res.json({
        message: 'Transaksi berhasil disimpan.',
        id: this.lastID,
      });
    }
  );
});

app.delete('/api/transactions/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.run(
    'DELETE FROM transactions WHERE id = ?',
    [id],
    function (err) {
      if (err) {
        console.error('Error delete transaction:', err.message);
        return res
          .status(500)
          .json({ message: 'Gagal menghapus transaksi.' });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ message: 'Transaksi tidak ditemukan.' });
      }
      res.json({ message: 'Transaksi berhasil dihapus.' });
    }
  );
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
