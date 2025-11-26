import React, { useMemo } from 'react';
import {
  BarChart3,
  Package,
  AlertTriangle,
  Activity,
  Clock,
} from 'lucide-react';

const DashboardPage = ({ finalInventory, transactions }) => {
  // total jenis item
  const totalItems = finalInventory.length;

  // total semua stok akhir
  const totalStock = useMemo(
    () =>
      finalInventory.reduce(
        (sum, item) => sum + (Number(item.finalStock) || 0),
        0
      ),
    [finalInventory]
  );

  // item dengan stok rendah (<3)
  const lowStockItems = useMemo(
    () => finalInventory.filter((item) => (item.finalStock || 0) < 3),
    [finalInventory]
  );

  const totalLowStock = lowStockItems.length;

  // transaksi bulan ini
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const txThisMonth = useMemo(
    () =>
      transactions.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }),
    [transactions, thisMonth, thisYear]
  );

  const totalTxThisMonth = txThisMonth.length;
  const totalInThisMonth = txThisMonth
    .filter((t) => t.type === 'IN')
    .reduce((s, t) => s + (Number(t.quantity) || 0), 0);
  const totalOutThisMonth = txThisMonth
    .filter((t) => t.type === 'OUT')
    .reduce((s, t) => s + (Number(t.quantity) || 0), 0);

  // 5 transaksi terbaru
  const latestTx = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [transactions]
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Dashboard Ringkas
        </h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          icon={Package}
          title="Total Jenis Item"
          value={totalItems}
          subtitle="Master item terdaftar"
        />
        <SummaryCard
          icon={Activity}
          title="Total Stok Akhir"
          value={totalStock.toLocaleString('id-ID')}
          subtitle="Semua item"
        />
        <SummaryCard
          icon={AlertTriangle}
          title="Item Stok Rendah"
          value={totalLowStock}
          subtitle="< 3 unit"
          highlight={totalLowStock > 0}
        />
        <SummaryCard
          icon={Clock}
          title="Transaksi Bulan Ini"
          value={totalTxThisMonth}
          subtitle={`Masuk: ${totalInThisMonth.toLocaleString(
            'id-ID'
          )} • Keluar: ${totalOutThisMonth.toLocaleString('id-ID')}`}
        />
      </div>

      {/* Low stock list */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Daftar Item Stok Rendah (&lt; 3)
          </h3>
          <span className="text-xs text-gray-500">
            {totalLowStock === 0
              ? 'Semua stok aman'
              : `${totalLowStock} item membutuhkan perhatian`}
          </span>
        </div>

        {totalLowStock === 0 ? (
          <p className="text-sm text-green-600">
            👍 Tidak ada item dengan stok di bawah 3.
          </p>
        ) : (
          <div className="max-h-52 overflow-y-auto space-y-2">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm"
              >
                {/* nama item kiri, boleh multi-line */}
                <span className="flex-1 pr-3 text-gray-800 leading-relaxed">
                  {item.name} ({item.id})
                </span>

                {/* qty kanan: selalu rata kanan & 1 baris */}
                <span className="min-w-[60px] text-right font-bold text-red-600 whitespace-nowrap">
                  {item.finalStock}{' '}
                  <span className="text-xs font-normal text-gray-500">
                    {item.unit || 'Pcs'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest transactions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            5 Transaksi Terbaru
          </h3>
        </div>

        {latestTx.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada transaksi yang tercatat.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-60">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="border-b bg-gray-50 text-gray-500 text-[11px] uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Tanggal</th>
                  <th className="px-3 py-2 text-left">Jenis</th>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {latestTx.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                      {t.date}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          t.type === 'IN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {t.type === 'IN' ? 'MASUK' : 'KELUAR'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {t.itemName}
                    </td>
                    <td
                      className={`px-3 py-2 whitespace-nowrap font-bold ${
                        t.type === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'OUT' ? '-' : '+'}{' '}
                      {t.quantity?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, subtitle, highlight }) => (
  <div
    className={`flex items-center justify-between p-4 rounded-xl border shadow-sm bg-white ${
      highlight ? 'border-red-200 bg-red-50/80' : 'border-gray-100'
    }`}
  >
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="mt-1 text-[11px] text-gray-500">{subtitle}</p>
      )}
    </div>
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        highlight ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'
      }`}
    >
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

export default DashboardPage;
