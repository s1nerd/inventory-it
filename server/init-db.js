// server/init-db.js
const Database = require('better-sqlite3');
const db = new Database('inventory.db');

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT CHECK(type IN ('IN','OUT')) NOT NULL,
  itemId TEXT NOT NULL,
  itemName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
);
`);

console.log('Database and tables created (inventory.db).');
db.close();
