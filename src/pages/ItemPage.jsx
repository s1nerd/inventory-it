import React from 'react';
import { Package, Plus, Edit3, Trash2 } from 'lucide-react';

const ItemPage = ({
  inventory,
  itemFormState,
  isEditingItem,
  showItemForm,
  itemToDelete,
  onItemFormChange,
  onItemAddOrEdit,
  onStartEditItem,
  onConfirmDeleteItem,
  onDeleteItemPermanent,
  onCancelDeleteItem,
  setItemFormState,
  setIsEditingItem,
  setShowItemForm,
}) => {
  // Cari kode item terbesar (berdasarkan angka di belakang, misal IT-0000020)
  const lastCode = React.useMemo(() => {
    if (!inventory || inventory.length === 0) return null;

    return inventory.reduce((maxId, item) => {
      const currentId = item.id || '';
      const matchCurr = currentId.match(/(\d+)$/);
      const currNum = matchCurr ? parseInt(matchCurr[1], 10) : 0;

      if (!maxId) return currentId;
      const matchMax = maxId.match(/(\d+)$/);
      const maxNum = matchMax ? parseInt(matchMax[1], 10) : 0;

      return currNum > maxNum ? currentId : maxId;
    }, null);
  }, [inventory]);

  const resetForm = () => {
    setItemFormState({ id: '', name: '', unit: 'Unit', stock: 0 });
    setIsEditingItem(false);
  };

  const handleToggleForm = () => {
    if (showItemForm || isEditingItem) {
      setShowItemForm(false);
      resetForm();
    } else {
      setShowItemForm(true);
      resetForm();
    }
  };

  const handleCancelForm = () => {
    resetForm();
    setShowItemForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header + tombol form */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Package className="w-5 h-5 mr-2 text-indigo-600" />
          Master Item
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleToggleForm}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showItemForm || isEditingItem ? 'Tutup Form' : 'Tambah Item'}
          </button>
        </div>
      </div>

      {/* Form Tambah / Edit Item */}
      {(showItemForm || isEditingItem) && (
        <div className="p-4 mb-4 border border-indigo-400 bg-indigo-50 rounded-lg shadow-inner space-y-3">
          <h3 className="text-lg font-bold text-indigo-700 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            {isEditingItem ? 'Edit Item Inventaris' : 'Tambah Item Inventaris Baru'}
          </h3>

          <form
            onSubmit={onItemAddOrEdit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Kode Item */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="itemIdInput"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Kode Item (Contoh: KBL-01)
                </label>
                {lastCode && !isEditingItem && (
                  <p className="text-[11px] text-gray-500">
                    Kode terakhir:&nbsp;
                    <span className="font-semibold">{lastCode}</span>
                  </p>
                )}
              </div>
              <input
                type="text"
                id="itemIdInput"
                name="id"
                required
                value={itemFormState.id}
                onChange={onItemFormChange}
                placeholder={
                  !isEditingItem && lastCode
                    ? `Misal: setelah ${lastCode}`
                    : 'Misal: IT-000001'
                }
                className="mt-1 block w-full border border-indigo-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isEditingItem}
              />
            </div>

            {/* Nama Item */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="itemNameInput"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Nama Item
                </label>
                {/* Placeholder transparan supaya tinggi baris sama dengan kolom kiri */}
                <span className="text-[11px] text-transparent">placeholder</span>
              </div>
              <input
                type="text"
                id="itemNameInput"
                name="name"
                required
                value={itemFormState.name}
                onChange={onItemFormChange}
                className="mt-1 block w-full border border-indigo-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Stok Awal */}
            <div className="space-y-1">
              <label
                htmlFor="itemStockInput"
                className="block text-xs font-semibold text-gray-700"
              >
                Stok Awal
              </label>
              <input
                type="number"
                id="itemStockInput"
                name="stock"
                required
                min="0"
                value={itemFormState.stock}
                onChange={onItemFormChange}
                className="mt-1 block w-full border border-indigo-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Satuan */}
            <div className="space-y-1">
              <label
                htmlFor="itemUnitInput"
                className="block text-xs font-semibold text-gray-700"
              >
                Satuan (Contoh: Unit, Pcs)
              </label>
              <input
                type="text"
                id="itemUnitInput"
                name="unit"
                required
                value={itemFormState.unit}
                onChange={onItemFormChange}
                className="mt-1 block w-full border border-indigo-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Tombol Aksi */}
            <div className="md:col-span-2 flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
              >
                {isEditingItem ? 'Simpan Perubahan' : 'Tambah Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Master Item (dengan scroll) */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Awal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {it.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 break-words min-w-0">
                    {it.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {it.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {it.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex space-x-2">
                    <button
                      onClick={() => onStartEditItem(it)}
                      className="flex items-center px-3 py-1 rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => onConfirmDeleteItem(it.id)}
                      className="flex items-center px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                    Belum ada item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Konfirmasi Hapus */}
      {itemToDelete && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <p>
            Konfirmasi: Anda akan menghapus item <strong>{itemToDelete}</strong> beserta seluruh
            riwayat transaksinya. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="mt-3 flex justify-end space-x-2">
            <button
              onClick={onCancelDeleteItem}
              className="px-3 py-1 bg-white border rounded-md"
            >
              Batal
            </button>
            <button
              onClick={onDeleteItemPermanent}
              className="px-3 py-1 bg-red-600 text-white rounded-md"
            >
              Hapus Permanen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemPage;
