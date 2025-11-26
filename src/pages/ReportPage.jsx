import React from 'react';
import { FileText, Search, Download } from 'lucide-react';

const ReportPage = ({
  transactions,
  finalInventory,
  reportFilter,
  setReportFilter,
  reportDateFrom,
  setReportDateFrom,
  reportDateTo,
  setReportDateTo,
  reportType,
  setReportType,
  exportTransactionsToExcel,
}) => {
  // Urutkan transaksi terbaru di atas
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Siapkan map stok akhir per transaksi (running balance per item)
  const stockAfterMap = new Map();
  const perItemStock = new Map();
  finalInventory.forEach((item) => {
    perItemStock.set(item.id, item.finalStock ?? item.stock ?? 0);
  });

  sortedTransactions.forEach((t) => {
    const current = perItemStock.get(t.itemId) ?? 0;
    stockAfterMap.set(t.id, current);

    let prev = current;
    const q = Number(t.quantity || 0);
    if (t.type === 'IN') prev = current - q;
    else if (t.type === 'OUT') prev = current + q;
    perItemStock.set(t.itemId, prev);
  });

  // Lookup satuan per item
  const unitMap = new Map(finalInventory.map((item) => [item.id, item.unit]));

  // Filter berdasarkan teks + tanggal + jenis
  const filteredTransactions = sortedTransactions.filter((t) => {
    if (reportType !== 'ALL' && t.type !== reportType) return false;
    if (reportDateFrom && t.date < reportDateFrom) return false;
    if (reportDateTo && t.date > reportDateTo) return false;

    if (!reportFilter.trim()) return true;
    const lowerCaseFilter = reportFilter.toLowerCase();
    return (
      t.itemName.toLowerCase().includes(lowerCaseFilter) ||
      t.itemId.toLowerCase().includes(lowerCaseFilter)
    );
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
        Laporan Transaksi & Stok
      </h2>

      {/* Ringkasan Stok Akhir */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold mb-3 text-indigo-700">Ringkasan Stok Akhir</h3>
        <div className="max-h-80 overflow-y-auto pr-1">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {finalInventory.map((item) => {
              const isLow = item.finalStock < 3; // stok rendah < 3
              return (
                <li
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200"
                >
                  {/* Nama item */}
                  <span className="text-sm font-medium text-gray-700 mr-3">
                    {item.name} ({item.id})
                  </span>

                  {/* Blok qty rapi di kanan */}
                  <span className="flex flex-col items-end min-w-[70px]">
                    <span
                      className={`text-lg font-extrabold leading-none ${
                        isLow ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {item.finalStock.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {item.unit}
                    </span>
                    {isLow && (
                      <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">
                        Low
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Filter Laporan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tanggal Dari */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tanggal Dari
            </label>
            <input
              type="date"
              value={reportDateFrom}
              onChange={(e) => setReportDateFrom(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Tanggal Sampai */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tanggal Sampai
            </label>
            <input
              type="date"
              value={reportDateTo}
              onChange={(e) => setReportDateTo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Jenis Transaksi */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Jenis Transaksi
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            >
              <option value="ALL">Semua</option>
              <option value="IN">MASUK</option>
              <option value="OUT">KELUAR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detail Transaksi */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold mb-3 text-indigo-700">
          Riwayat Transaksi (Terbaru di atas)
        </h3>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama atau Kode Item..."
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
          </div>

          <button
            onClick={exportTransactionsToExcel}
            className="flex-shrink-0 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
            disabled={transactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export ke Excel
          </button>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <Th>Tgl</Th>
                <Th>Jenis</Th>
                <Th>Item</Th>
                <Th>Kuantitas</Th>
                <Th>Stok Akhir</Th>
                <Th>Catatan</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((t) => {
                const stockAfter = stockAfterMap.get(t.id);
                const unit = unitMap.get(t.itemId) || '';
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {t.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          t.type === 'IN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {t.type === 'IN' ? 'MASUK' : 'KELUAR'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 break-words max-w-xs">
                      {t.itemName}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${
                        t.type === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'OUT' ? '-' : '+'}{' '}
                      {t.quantity.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {typeof stockAfter === 'number'
                        ? `${stockAfter.toLocaleString('id-ID')} ${unit}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {t.notes}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 italic">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
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
  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

export default ReportPage;
