README – Sistem Inventaris IT (Frontend + Backend + Backup Otomatis)
📌 1. Persyaratan Sistem (Install sekali di server/laptop baru)

Pastikan server/laptop sudah ter-install:

Node.js LTS (disarankan v18 atau v20)

Git (opsional)

PM2 secara global (untuk backup otomatis)

npm install -g pm2


Cek versi:

node -v
npm -v
pm2 -v

🚀 2. Struktur Folder
inventory/
│
├── server/
│   ├── index.js
│   ├── db.js
│   ├── backup.js
│   ├── inventory.db
│   ├── package.json
│
└── web/ (frontend React)
    ├── package.json
    ├── src/
    └── dist/

⚙️ 3. Instalasi Pertama (Frontend + Backend)
A. Install Backend

Masuk folder server:

cd server
npm install


Jalankan backend pertama kali:

npm run dev


Jika berhasil, tampil:

Inventory API running on http://localhost:3001

B. Install Frontend

Masuk ke folder web:

cd web
npm install
npm run dev


Jalankan UI:

http://localhost:5173

📦 4. Cara Menjalankan Aplikasi di Server (Production Mode)
A. Jalankan Backend dengan PM2

Agar backend berjalan terus walaupun server restart:

cd server
pm2 start index.js --name inventory-api


Cek status:

pm2 status


Lihat log:

pm2 logs inventory-api


Restart backend:

pm2 restart inventory-api


Stop backend:

pm2 stop inventory-api

🔄 5. Menjalankan Backup Otomatis

Backup berjalan menggunakan backup.js yang dipantau PM2.

A. Jalankan backup script
cd server
pm2 start backup.js --name inventory-backup

B. Atur jadwal backup otomatis (default: jam 2 pagi)

Jika backup.js membaca env BACKUP_CRON, set:

pm2 set inventory-backup:BACKUP_CRON "0 2 * * *"

C. Simpan proses agar berjalan otomatis setelah restart Windows
pm2 startup
pm2 save


Sekarang backup berjalan otomatis setiap hari jam 02:00 pagi.

🖥️ 6. Cara Start Ulang Aplikasi Setelah Laptop/Server Dimatikan

Setiap kali komputer/server dinyalakan:

Cukup jalankan satu perintah:

pm2 resurrect


Atau jika kamu sudah pakai pm2 save, PM2 akan auto-start setelah Windows Boot.

Cek:

pm2 status


Harus muncul:

inventory-api        online
inventory-backup     online


Jika belum online, jalankan:

pm2 start inventory-api
pm2 start inventory-backup

🧹 7. Cara Stop Semua Layanan

Jika ingin menghentikan semuanya:

pm2 stop all


Jika ingin menghentikan salah satu:

pm2 stop inventory-api
pm2 stop inventory-backup

🗃️ 8. Lokasi Penyimpanan Backup

Backup biasanya disimpan ke folder:

server/backups/


Format file:

backup-YYYY-MM-DD.sqlite

🛠️ 9. Pindah ke Server Baru / Laptop Baru

Copy seluruh folder inventory/ ke server baru

Install Node.js dan PM2

Jalankan perintah:

cd server
npm install
pm2 start index.js --name inventory-api
pm2 start backup.js --name inventory-backup
pm2 set inventory-backup:BACKUP_CRON "0 2 * * *"
pm2 save


Install frontend:

cd web
npm install
npm run build


Jika ingin hosting frontend secara static, gunakan:

npm install -g serve
serve -s dist

🧪 10. Test Semua Berjalan

Frontend:

http://localhost:5173  (dev mode)
http://localhost:3000  (jika pakai serve)


Backend:

http://localhost:3001/api/items
http://localhost:3001/api/transactions


Backup:

pm2 logs inventory-backup


Cek folder backups:

server/backups/

🎯 11. Selesai

Sekarang aplikasi inventaris kamu:

✔ Bisa dijalankan ulang kapan saja
✔ Bisa dipindah ke server baru
✔ Otomatis backup setiap hari
✔ Dikelola PM2, jadi aman walaupun server mati