// server/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "inventory.db");
const db = new sqlite3.Database(dbPath);

// helper: run (INSERT / UPDATE / DELETE)
function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      // kembalikan info: lastID dan changes
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// helper: get single row
function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// helper: all rows
function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,

  // ITEMS
  getItems: () => all("SELECT * FROM items ORDER BY name"),
  getItemById: (id) => get("SELECT * FROM items WHERE id = ?", [id]),
  insertItem: (item) =>
    run("INSERT INTO items (id,name,stock,unit) VALUES (?,?,?,?)", [
      item.id,
      item.name,
      item.stock,
      item.unit,
    ]),
  updateItem: (item) =>
    run("UPDATE items SET name = ?, stock = ?, unit = ? WHERE id = ?", [
      item.name,
      item.stock,
      item.unit,
      item.id,
    ]),
  deleteItem: (id) => run("DELETE FROM items WHERE id = ?", [id]),

  // TRANSACTIONS
  getTransactions: () =>
    all("SELECT * FROM transactions ORDER BY date DESC, id DESC"),
  insertTransaction: (t) =>
    run(
      "INSERT INTO transactions (date,type,itemId,itemName,quantity,notes) VALUES (?,?,?,?,?,?)",
      [t.date, t.type, t.itemId, t.itemName, t.quantity, t.notes]
    ),
  deleteTransactionsByItem: (itemId) =>
    run("DELETE FROM transactions WHERE itemId = ?", [itemId]),
};
