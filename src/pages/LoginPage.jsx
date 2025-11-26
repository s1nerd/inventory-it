// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { RefreshCw, Lock } from 'lucide-react';

// catatan:
// - apiBase tetap ada di props supaya kompatibel dengan App.jsx,
//   tapi di versi ini TIDAK dipakai karena login lokal saja.
const LoginPage = ({ apiBase, onLoginSuccess }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // daftar user lokal sederhana (bisa kamu tambah sendiri)
  const LOCAL_USERS = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    // contoh tambahan:
    // { id: 2, username: 'ituser', password: 'ituser123', role: 'user' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.username || !form.password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);

    // LOGIN LOKAL: cek ke daftar LOCAL_USERS di atas
    const found = LOCAL_USERS.find(
      (u) =>
        u.username === form.username.trim() &&
        u.password === form.password
    );

    if (!found) {
      setLoading(false);
      setErrorMsg('Username atau password salah.');
      return;
    }

    // token palsu hanya untuk memenuhi alur di App.jsx
    const fakeToken = 'local-login-token';

    onLoginSuccess(
      { id: found.id, username: found.username, role: found.role },
      fakeToken
    );

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header mini selaras dengan app */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 mr-2 text-indigo-600 animate-spin-slow" />
            Sistem Inventaris IT
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Silakan login untuk mengakses dashboard.
          </p>
        </div>

        {/* Card Login */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center mr-2">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Login Pengguna</h2>
              {/* <p className="text-xs text-gray-500">
                Gunakan akun IT. Default: <b>admin / admin123</b>
              </p> */}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="contoh: admin"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 flex items-center justify-center border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Akses hanya untuk tim IT internal.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
