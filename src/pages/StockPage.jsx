import React from 'react';
import { Box, Search, Download } from 'lucide-react';

const StockPage = ({
  finalInventory,
  stockMovements,
  stockFilter,
  onChangeStockFilter,
  onExportStock,
}) => {
  const filteredStock = finalInventory.filter((item) => {
    if (!stockFilter.trim()) return true;
    const q = stockFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
        <Box className="w-5 h-5 mr-2 text-indigo-600" />
        Daftar Stok Akhir Inventaris
      </h2>

      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama atau Kode..."
            value={stockFilter}
            onChange={(e) => onChangeStockFilter(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          />
        </div>

        <button
          onClick={onExportStock}
          className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={finalInventory.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Stok Akhir
        </button>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Kode Item</Th>
                <Th>Nama Item</Th>
                <Th>Saldo Awal</Th>
                <Th>Barang Masuk</Th>
                <Th>Barang Keluar</Th>
                <Th>Stok Akhir</Th>
                <Th>Satuan</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStock.map((item) => {
                const movement = stockMovements.get(item.id) || { in: 0, out: 0 };
                const saldoAwal = item.stock ?? 0;
                const barangMasuk = movement.in;
                const barangKeluar = movement.out;
                const isLow = item.finalStock < 3;

                return (
                  <tr key={item.id} className="hover:bg-indigo-50 transition duration-150">
                    <td className="px-4 py-2 whitespace-nowrap font-medium">
                      {item.id}
                    </td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {saldoAwal.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-green-600 font-semibold">
                      {barangMasuk.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-red-600 font-semibold">
                      {barangKeluar.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap font-bold">
                      <span
                        className={isLow ? 'text-red-600' : 'text-green-600'}
                      >
                        {item.finalStock.toLocaleString('id-ID')}
                      </span>
                      {isLow && (
                        <span className="ml-1 text-[10px] text-red-500 font-semibold opacity-70">
                          Low
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                      {item.unit}
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 italic"
                  >
                    Tidak ada item yang cocok dengan pencarian "
                    {stockFilter}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
    {children}
  </th>
);

export default StockPage;
