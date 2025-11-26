import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Box,
} from "lucide-react";

const TransactionPage = ({
  type,
  formState,
  onSubmitTransaction,
  onFormChange,
  selectedItem,
  finalInventory,
  itemComboRef,
  transactionItemSearch,
  setTransactionItemSearch,
  transactionDropdownOpen,
  setTransactionDropdownOpen,
}) => {

  // =============== FILTER LIST BERDASARKAN SEARCH ===============
  const filteredItems = finalInventory.filter(item => {
    if (!transactionItemSearch.trim()) return true;
    const q = transactionItemSearch.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  // ================== INPUT PILIH ITEM ==================
  const ItemSelector = (
    <div>
      <label className="text-sm font-medium">Item Inventaris</label>
      <div className="mt-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-gray-400" />

        <input
          ref={itemComboRef}
          placeholder="Cari nama atau kode item..."
          value={
            transactionItemSearch ||
            (selectedItem ? `${selectedItem.name} (${selectedItem.id})` : "")
          }
          onChange={(e) => {
            setTransactionItemSearch(e.target.value);
            setTransactionDropdownOpen(true);
            if (!e.target.value.trim()) {
              onFormChange({ target: { name: "itemId", value: "" } });
            }
          }}
          onFocus={() => setTransactionDropdownOpen(true)}
          onBlur={() => setTimeout(() => setTransactionDropdownOpen(false), 150)}
          className="w-full pl-9 p-2 border rounded shadow-sm text-sm"
        />

        {/* Dropdown pilihan hasil filter */}
        {transactionDropdownOpen && (
          <div className="absolute w-full shadow-lg border bg-white rounded max-h-56 overflow-auto z-50">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onMouseDown={() => {
                    onFormChange({ target: { name: "itemId", value: item.id } });
                    setTransactionItemSearch(`${item.name} (${item.id})`);
                    setTransactionDropdownOpen(false);
                  }}
                  className="p-2 cursor-pointer hover:bg-indigo-50 flex justify-between text-sm"
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-gray-500">Stok {item.finalStock}</span>
                </div>
              ))
            ) : (
              <div className="p-2 text-center text-gray-500 text-sm">Tidak ditemukan</div>
            )}
          </div>
        )}
      </div>
      <input type="hidden" name="itemId" value={formState.itemId} />
    </div>
  );

  // ================= STOK INFO (WARN LOW) =================
  const stockInfo =
    selectedItem && type === "OUT" && (
      <div className="mt-2 p-2 text-sm border rounded flex items-center gap-1
      bg-red-50 border-red-300 text-red-600 font-semibold">
        <Box className="w-4" />
        Stok: {selectedItem.finalStock} {selectedItem.unit}
        {selectedItem.finalStock < 3 && (
          <span className="ml-1 text-[10px] opacity-70">Low</span>
        )}
      </div>
    );

  const IN = type === "IN";

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmitTransaction}
        className="p-6 bg-white shadow border rounded-lg space-y-3"
      >
        <h2
          className={`text-xl font-bold flex items-center gap-2 ${
            IN ? "text-green-600" : "text-red-600"
          }`}
        >
          {IN ? <TrendingUp className="w-5" /> : <TrendingDown className="w-5" />}
          {IN ? "Barang Masuk" : "Barang Keluar"}
        </h2>

        {ItemSelector}

        {stockInfo}

        <Input title="Jumlah" type="number" min="1" name="quantity" value={formState.quantity} onChange={onFormChange} />
        <Input title="Tanggal" type="date" name="date" value={formState.date} onChange={onFormChange} />
        <Textarea title="Catatan" name="notes" value={formState.notes} onChange={onFormChange} />

        <button
          className={`w-full p-2 text-white rounded font-bold ${
            IN ? "bg-green-600" : "bg-red-600"
          } hover:opacity-90`}
        >
          SIMPAN
        </button>
      </form>
    </div>
  );
};

/* UI Components */
const Input = ({ title, ...props }) => (
  <label className="block text-sm font-medium">
    {title}
    <input {...props} className="mt-1 w-full border p-2 rounded shadow-sm text-sm" />
  </label>
);

const Textarea = ({ title, ...props }) => (
  <label className="block text-sm font-medium">
    {title}
    <textarea rows={2} {...props} className="mt-1 w-full border p-2 rounded shadow-sm text-sm" />
  </label>
);

export default TransactionPage;
