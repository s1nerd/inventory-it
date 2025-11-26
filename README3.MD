# 📦 Sistem Inventaris IT  
Aplikasi manajemen inventaris barang IT berbasis web untuk mencatat stok, barang masuk, keluar, dan laporan transaksi.  
Ringan, cepat, dan cocok digunakan untuk internal divisi IT.

---

## 🚀 Fitur Utama
- 📁 Master Item Inventaris (Tambah/Edit/Hapus)
- 📥 Barang Masuk (penambahan stok real-time)
- 📤 Barang Keluar (tracking distribusi barang)
- 📊 Stok Akhir dihitung otomatis
- 🔍 Filter pencarian item & stok rendah
- 📑 Laporan transaksi (terbaru berada di atas)
- 📄 Export ke Excel (.xlsx)
- 🔐 Sistem Login (lokal, untuk internal IT)

---

## 🏗️ Teknologi yang Digunakan

### **Frontend**
| Teknologi | Fungsi |
|---|---|
| React.js | UI utama aplikasi |
| Vite | Bundler cepat untuk development |
| TailwindCSS | Styling modern & clean |
| Lucide-React | Icon UI (Box, Plus, Trash, dll) |
| SheetJS / XLSX | Export laporan ke Excel |
| LocalStorage | Menyimpan session login |

### **Backend**
| Teknologi | Fungsi |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API (items & transaksi) |
| SQLite | Database ringan & portable |
| SQLite3 / Better-sqlite3 | Query database |

### **Tools & Build**
| Teknologi | Fungsi |
|---|---|
| npm | Dependency manager |
| PowerShell `start-inventory.ps1` | Menjalankan backend + frontend otomatis |
| CMD scripts | Opsional, bisa dihapus |

---

## 📁 Struktur Project

