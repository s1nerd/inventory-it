import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  RefreshCw,
  Box,
  Plus,
  Minus,
  FileText,
  Package,
  BarChart3,
  LogOut,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import DashboardPage from './pages/DashboardPage';
import StockPage from './pages/StockPage';
import ItemPage from './pages/ItemPage';
import TransactionPage from './pages/TransactionPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';

// API base (ubah bila server berjalan di port/host lain)
const API_BASE = 'http://localhost:3001/api';

// Fungsi tanggal hari ini YYYY-MM-DD
const getTodayDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// fallback lokal (jika server mati, jarang dipakai setelah ada auth)
const fallbackInventory = [
  { id: 'LAPTOP-001', name: 'Laptop Core i7', stock: 15, unit: 'Unit' },
  { id: 'MONITOR-005', name: 'Monitor 24 inch LED', stock: 30, unit: 'Unit' },
  { id: 'HDD-010', name: 'SSD 512GB', stock: 50, unit: 'Pcs' },
];

const fallbackTransactions = [
  {
    id: Date.now() + 1,
    date: '2025-10-20',
    type: 'IN',
    itemId: 'LAPTOP-001',
    itemName: 'Laptop Core i7',
    quantity: 10,
    notes: 'Pembelian awal',
  },
  {
    id: Date.now() + 2,
    date: '2025-10-25',
    type: 'OUT',
    itemId: 'LAPTOP-001',
    itemName: 'Laptop Core i7',
    quantity: 2,
    notes: 'Distribusi Tim A',
  },
  {
    id: Date.now() + 3,
    date: '2025-11-01',
    type: 'IN',
    itemId: 'MONITOR-005',
    itemName: 'Monitor 24 inch LED',
    quantity: 15,
    notes: 'Pembelian Batch 2',
  },
];

const App = () => {
  // ==== AUTH STATE ====
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // state utama
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard','stock','item','in','out','report'

  const [formType, setFormType] = useState('IN');
  const [formState, setFormState] = useState({
    itemId: '',
    quantity: 1,
    date: getTodayDate(),
    notes: '',
  });

  // notifikasi
  const [message, setMessage] = useState(null);
  const displayMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // filter laporan
  const [reportFilter, setReportFilter] = useState('');
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportType, setReportType] = useState('ALL'); // ALL | IN | OUT

  // filter stok akhir
  const [stockFilter, setStockFilter] = useState('');

  // combobox transaksi
  const [transactionItemSearch, setTransactionItemSearch] = useState('');
  const [transactionDropdownOpen, setTransactionDropdownOpen] = useState(false);
  const itemComboRef = useRef(null);

  // form item
  const [itemFormState, setItemFormState] = useState({
    id: '',
    name: '',
    unit: 'Unit',
    stock: 0,
  });
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ==== AUTH INIT: BACA DARI LOCALSTORAGE ====
  useEffect(() => {
    const savedToken = localStorage.getItem('inv_token');
    const savedUser = localStorage.getItem('inv_user');
    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        setAuthUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('inv_token');
        localStorage.removeItem('inv_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user, token) => {
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem('inv_token', token);
    localStorage.setItem('inv_user', JSON.stringify(user));
    displayMessage(`Login berhasil. Selamat datang, ${user.username}!`, 'success');
  };

  const handleLogout = () => {
    setAuthUser(null);
    setAuthToken(null);
    localStorage.removeItem('inv_token');
    localStorage.removeItem('inv_user');
    setInventory([]);
    setTransactions([]);
    setActiveTab('dashboard');
  };

  // AUTH headers helper
  const getAuthHeaders = (extra = {}) => {
    if (!authToken) return extra;
    return {
      ...extra,
      Authorization: `Bearer ${authToken}`,
    };
  };

  // --- HITUNG STOK AKHIR ---
  const calculateFinalStock = useCallback((inventoryData, transactionsData) => {
    const stockMap = new Map();
    inventoryData.forEach((item) => {
      stockMap.set(item.id, item.stock || 0);
    });

    transactionsData.forEach((t) => {
      if (!stockMap.has(t.itemId)) return;
      let current = stockMap.get(t.itemId);
      if (t.type === 'IN') current += Number(t.quantity || 0);
      else if (t.type === 'OUT') current -= Number(t.quantity || 0);
      stockMap.set(t.itemId, current);
    });

    return inventoryData
      .map((item) => ({
        ...item,
        finalStock: stockMap.get(item.id) ?? item.stock ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const finalInventory = useMemo(
    () => calculateFinalStock(inventory, transactions),
    [inventory, transactions, calculateFinalStock]
  );

  // pergerakan stok masuk/keluar
  const stockMovements = useMemo(() => {
    const map = new Map();
    transactions.forEach((t) => {
      const q = Number(t.quantity || 0);
      if (!map.has(t.itemId)) map.set(t.itemId, { in: 0, out: 0 });
      const entry = map.get(t.itemId);
      if (t.type === 'IN') entry.in += q;
      else if (t.type === 'OUT') entry.out += q;
    });
    return map;
  }, [transactions]);

  // item dipilih
  const selectedItem = useMemo(
    () => finalInventory.find((item) => item.id === formState.itemId),
    [formState.itemId, finalInventory]
  );

  // API helper
  const api = {
    getItems: async () => {
      const r = await fetch(`${API_BASE}/items`, {
        headers: getAuthHeaders(),
      });
      if (!r.ok) throw new Error('Failed to fetch items');
      return r.json();
    },
    createItem: async (item) => {
      const r = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(item),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    updateItem: async (id, payload) => {
      const r = await fetch(`${API_BASE}/items/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    deleteItem: async (id) => {
      const r = await fetch(`${API_BASE}/items/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },

    getTransactions: async () => {
      const r = await fetch(`${API_BASE}/transactions`, {
        headers: getAuthHeaders(),
      });
      if (!r.ok) throw new Error('Failed to fetch transactions');
      return r.json();
    },
    createTransaction: async (tx) => {
      const r = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(tx),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    deleteTransaction: async (id) => {
      const r = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  };

  // load awal data dari server saat sudah login
  useEffect(() => {
    if (!authToken) {
      // jika belum login, jangan load apa-apa
      return;
    }
    let mounted = true;
    const loadAll = async () => {
      try {
        const [itemsRes, txRes] = await Promise.all([
          fetch(`${API_BASE}/items`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/transactions`, { headers: getAuthHeaders() }),
        ]);

        if (!itemsRes.ok || !txRes.ok) throw new Error('Server response not ok');

        const items = await itemsRes.json();
        const tx = await txRes.json();

        if (mounted) {
          setInventory(Array.isArray(items) ? items : fallbackInventory);
          setTransactions(Array.isArray(tx) ? tx : fallbackTransactions);
        }
      } catch (err) {
        console.error('Gagal load data dari server:', err.message);
        if (mounted) {
          setInventory(fallbackInventory);
          setTransactions(fallbackTransactions);
        }
        displayMessage('Tidak dapat terhubung ke server. Menggunakan data lokal.', 'error');
      }
    };
    loadAll();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // reset dropdown tiap ganti tab
  useEffect(() => {
    setTransactionDropdownOpen(false);
  }, [activeTab]);

  // handler form transaksi
  const handleFormChange = (e) => {
  const { name, value } = e.target;

  setFormState((prev) => ({
    ...prev,
    [name]:
      name === 'quantity'
        // biarkan kosong dulu supaya bisa diketik manual
        ? (value === '' ? '' : Math.max(0, Number(value)))
        : value,
  }));
};

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();

    if (!selectedItem) {
      displayMessage('Pilih item yang valid sebelum mencatat transaksi.', 'error');
      return;
    }

    if (formState.quantity <= 0) {
      displayMessage('Kuantitas harus lebih dari 0.', 'error');
      return;
    }

    if (formType === 'OUT' && selectedItem.finalStock < formState.quantity) {
      displayMessage(
        `Gagal: Stok akhir untuk ${selectedItem.name} hanya ${selectedItem.finalStock}. Kuantitas keluar melebihi stok.`,
        'error'
      );
      return;
    }

    const newTx = {
      date: formState.date,
      type: formType,
      itemId: formState.itemId,
      itemName: selectedItem.name,
      quantity: Number(formState.quantity),
      notes: formState.notes || '',
    };

    try {
      await api.createTransaction(newTx);
      const [tx, items] = await Promise.all([
        api.getTransactions(),
        api.getItems(),
      ]);
      setTransactions(tx);
      setInventory(items);

      setFormState({
        itemId: '',
        quantity: 1,
        date: getTodayDate(),
        notes: '',
      });
      setTransactionItemSearch('');
      setTransactionDropdownOpen(false);
      setActiveTab('stock');
      displayMessage(
        `Transaksi ${formType === 'IN' ? 'MASUK' : 'KELUAR'} untuk ${
          selectedItem.name
        } berhasil dicatat!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      displayMessage(`Gagal menyimpan transaksi: ${err.message}`, 'error');
    }
  };

  // handler item
  const handleItemFormChange = (e) => {
  const { name, value } = e.target;

  setItemFormState((prev) => ({
    ...prev,
    [name]:
      name === 'stock'
        // biarkan kosong saat user menghapus angka, supaya bisa ketik manual
        ? (value === '' ? '' : Math.max(0, Number(value)))
        : value,
  }));
};

  const handleItemAddOrEdit = async (e) => {
    e.preventDefault();
    const { id, name, unit, stock } = itemFormState;
    if (!id || !name) {
      displayMessage('Kode dan nama item wajib diisi.', 'error');
      return;
    }

    const idUpper = id.toUpperCase().trim();

    try {
      if (isEditingItem) {
        await api.updateItem(idUpper, {
          name: name.trim(),
          stock: Number(stock || 0),
          unit: unit.trim(),
        });
        displayMessage(`Item ${idUpper} berhasil diperbarui.`, 'success');
      } else {
        await api.createItem({
          id: idUpper,
          name: name.trim(),
          stock: Number(stock || 0),
          unit: unit.trim(),
        });
        displayMessage(`Item ${idUpper} berhasil ditambahkan.`, 'success');
      }

      const [items, tx] = await Promise.all([
        api.getItems(),
        api.getTransactions(),
      ]);
      setInventory(items);
      setTransactions(tx);
      setItemFormState({ id: '', name: '', unit: 'Unit', stock: 0 });
      setIsEditingItem(false);
      setShowItemForm(false);
    } catch (err) {
      console.error(err);
      displayMessage(`Gagal menyimpan item: ${err.message}`, 'error');
    }
  };

  const startEditItem = (item) => {
    setIsEditingItem(true);
    setShowItemForm(true);
    setItemFormState({
      id: item.id,
      name: item.name,
      unit: item.unit,
      stock: item.stock,
    });
    setActiveTab('item');
  };

  const confirmDeleteItem = (itemId) => setItemToDelete(itemId);

  const handleDeleteItemPermanent = async (e) => {
    e.preventDefault();
    if (!itemToDelete) return;

    try {
      await api.deleteItem(itemToDelete);
      const [items, tx] = await Promise.all([
        api.getItems(),
        api.getTransactions(),
      ]);
      setInventory(items);
      setTransactions(tx);
      displayMessage(
        `Item ${itemToDelete} dan semua riwayat transaksinya telah dihapus permanen.`,
        'success'
      );
      setItemFormState({ id: '', name: '', unit: 'Unit', stock: 0 });
      setIsEditingItem(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      displayMessage(`Gagal menghapus item: ${err.message}`, 'error');
    }
  };

  const cancelDeleteItem = () => setItemToDelete(null);

  // --- EXPORT TRANSAKSI KE EXCEL (mengikuti filter laporan) ---
  const exportTransactionsToExcel = () => {
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const transactionsToExport = sortedTransactions.filter((t) => {
      if (reportType !== 'ALL' && t.type !== reportType) return false;
      if (reportDateFrom && t.date < reportDateFrom) return false;
      if (reportDateTo && t.date > reportDateTo) return false;

      if (!reportFilter.trim()) return true;
      const q = reportFilter.toLowerCase();
      return (
        t.itemName.toLowerCase().includes(q) ||
        t.itemId.toLowerCase().includes(q)
      );
    });

    if (transactionsToExport.length === 0) {
      displayMessage('Tidak ada data transaksi yang dapat diekspor.', 'error');
      return;
    }

    const header = [
      'ID Transaksi',
      'Tanggal',
      'Jenis',
      'Kode Item',
      'Nama Item',
      'Kuantitas',
      'Catatan',
    ];

    const rows = transactionsToExport.map((t) => [
      t.id,
      t.date,
      t.type === 'IN' ? 'MASUK' : 'KELUAR',
      t.itemId,
      t.itemName,
      t.quantity,
      t.notes,
    ]);

    const data = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Laporan_Transaksi_Inventaris_${getTodayDate()}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    displayMessage(
      'Laporan transaksi berhasil diekspor sebagai Excel (.xlsx)!',
      'success'
    );
  };

  // --- EXPORT STOK AKHIR KE EXCEL ---
  const exportStockToExcel = () => {
    if (finalInventory.length === 0) {
      displayMessage('Tidak ada data stok untuk diekspor.', 'error');
      return;
    }

    const header = [
      'Kode Item',
      'Nama Item',
      'Saldo Awal',
      'Barang Masuk',
      'Barang Keluar',
      'Stok Akhir',
      'Satuan',
    ];

    const rows = finalInventory.map((item) => {
      const move = stockMovements.get(item.id) || { in: 0, out: 0 };
      const saldoAwal = item.stock ?? 0;
      return [
        item.id,
        item.name,
        saldoAwal,
        move.in,
        move.out,
        item.finalStock,
        item.unit,
      ];
    });

    const data = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 40 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StokAkhir');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Laporan_Stok_Akhir_${getTodayDate()}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    displayMessage(
      'Laporan stok akhir berhasil diekspor sebagai Excel (.xlsx)!',
      'success'
    );
  };

  // ====== RENDER: jika BELUM LOGIN → tampil LoginPage dulu ======
  if (!authUser || !authToken) {
    return <LoginPage apiBase={API_BASE} onLoginSuccess={handleLoginSuccess} />;
  }

  // ====== RENDER: SUDAH LOGIN ======
  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <header className="mb-4 p-4 bg-white rounded-xl shadow-lg border-b-4 border-indigo-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center justify-center sm:justify-start">
              <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 mr-2 text-indigo-600 animate-spin-slow" />
              Sistem Inventaris IT
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Pencatatan Barang Masuk, Keluar, dan Stok Akhir.
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <div className="text-right text-xs text-gray-600">
              <div className="font-semibold text-gray-800">
                Hi, {authUser?.username}
              </div>
              <div className="text-[11px] text-gray-500">
                Login sebagai: {authUser?.role || 'user'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        </header>

        {/* NOTIF */}
        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-white font-medium shadow-md transition-opacity duration-300 ${
              message.type === 'success'
                ? 'bg-green-600'
                : message.type === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* NAV TABS */}
        <nav className="mb-8 flex space-x-2 p-1 bg-white rounded-xl shadow-md">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'stock', label: 'Stok Akhir', icon: Box },
            { id: 'item', label: 'Item', icon: Package },
            { id: 'in', label: 'Barang Masuk', icon: Plus },
            { id: 'out', label: 'Barang Keluar', icon: Minus },
            { id: 'report', label: 'Laporan', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'in') setFormType('IN');
                if (tab.id === 'out') setFormType('OUT');
                setItemToDelete(null);

                if (tab.id !== 'out' && tab.id !== 'in') {
                  setTransactionItemSearch('');
                  setTransactionDropdownOpen(false);
                }
              }}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition duration-200 ease-in-out ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-1.5" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <main>
          {activeTab === 'dashboard' && (
            <DashboardPage
              finalInventory={finalInventory}
              transactions={transactions}
            />
          )}

          {activeTab === 'stock' && (
            <StockPage
              finalInventory={finalInventory}
              stockMovements={stockMovements}
              stockFilter={stockFilter}
              onChangeStockFilter={setStockFilter}
              onExportStock={exportStockToExcel}
            />
          )}

          {activeTab === 'item' && (
            <ItemPage
              inventory={inventory}
              itemFormState={itemFormState}
              isEditingItem={isEditingItem}
              showItemForm={showItemForm}
              itemToDelete={itemToDelete}
              onItemFormChange={handleItemFormChange}
              onItemAddOrEdit={handleItemAddOrEdit}
              onStartEditItem={startEditItem}
              onConfirmDeleteItem={confirmDeleteItem}
              onDeleteItemPermanent={handleDeleteItemPermanent}
              onCancelDeleteItem={cancelDeleteItem}
              setItemFormState={setItemFormState}
              setIsEditingItem={setIsEditingItem}
              setShowItemForm={setShowItemForm}
            />
          )}

          {activeTab === 'in' && (
            <TransactionPage
              type="IN"
              onSubmitTransaction={handleSubmitTransaction}
              formState={formState}
              onFormChange={handleFormChange}
              selectedItem={selectedItem}
              finalInventory={finalInventory}
              itemComboRef={itemComboRef}
              transactionItemSearch={transactionItemSearch}
              setTransactionItemSearch={setTransactionItemSearch}
              transactionDropdownOpen={transactionDropdownOpen}
              setTransactionDropdownOpen={setTransactionDropdownOpen}
            />
          )}

          {activeTab === 'out' && (
            <TransactionPage
              type="OUT"
              onSubmitTransaction={handleSubmitTransaction}
              formState={formState}
              onFormChange={handleFormChange}
              selectedItem={selectedItem}
              finalInventory={finalInventory}
              itemComboRef={itemComboRef}
              transactionItemSearch={transactionItemSearch}
              setTransactionItemSearch={setTransactionItemSearch}
              transactionDropdownOpen={transactionDropdownOpen}
              setTransactionDropdownOpen={setTransactionDropdownOpen}
            />
          )}

          {activeTab === 'report' && (
            <ReportPage
              transactions={transactions}
              finalInventory={finalInventory}
              reportFilter={reportFilter}
              setReportFilter={setReportFilter}
              reportDateFrom={reportDateFrom}
              setReportDateFrom={setReportDateFrom}
              reportDateTo={reportDateTo}
              setReportDateTo={setReportDateTo}
              reportType={reportType}
              setReportType={setReportType}
              exportTransactionsToExcel={exportTransactionsToExcel}
            />
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-gray-500 p-4 border-t border-gray-200">
          Aplikasi Dibuat dengan React &amp; Tailwind CSS. Stok dihitung secara real-time.
        </footer>
      </div>
    </div>
  );
};

export default App;
