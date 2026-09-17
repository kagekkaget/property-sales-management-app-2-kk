"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCog, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield } from "lucide-react";
import Modal from "@/components/Modal";
import { ToastContainer, useToast } from "@/components/Toast";
import { formatDateTime, getRoleLabel } from "@/lib/utils";
import { redirect } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800",
  manager: "bg-blue-100 text-blue-800",
  staff: "bg-green-100 text-green-800",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isNotOwner, setIsNotOwner] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "staff", phone: "", isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.status === 403) { setIsNotOwner(true); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setCurrentUserId(d.user?.id);
      if (d.user?.role !== "owner") setIsNotOwner(true);
    });
  }, [fetchUsers]);

  if (isNotOwner) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-700">Akses Ditolak</h2>
          <p className="text-slate-400 text-sm mt-1">Hanya Pemilik yang dapat mengakses halaman ini</p>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    setSelectedUser(null);
    setForm({ name: "", email: "", password: "", role: "staff", phone: "", isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (u: User) => {
    setSelectedUser(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, phone: u.phone || "", isActive: u.isActive });
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = (u: User) => {
    setSelectedUser(u);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!selectedUser && !form.password)) {
      addToast("Nama, email, dan password wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    try {
      const url = selectedUser ? `/api/users/${selectedUser.id}` : "/api/users";
      const method = selectedUser ? "PUT" : "POST";
      const body: Record<string, unknown> = { name: form.name, email: form.email, role: form.role, phone: form.phone, isActive: form.isActive };
      if (!selectedUser || form.password) body.password = form.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Terjadi kesalahan", "error"); return; }
      addToast(selectedUser ? "Pengguna berhasil diperbarui" : "Pengguna berhasil ditambah", "success");
      setIsModalOpen(false);
      fetchUsers();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Gagal menonaktifkan pengguna", "error"); return; }
      addToast("Pengguna berhasil dinonaktifkan", "success");
      setIsDeleteOpen(false);
      fetchUsers();
    } catch {
      addToast("Terjadi kesalahan", "error");
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCog className="w-7 h-7 text-amber-500" /> Kelola Pengguna
          </h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} pengguna terdaftar</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Memuat data...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <UserCog className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Tidak ada pengguna</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.map((u) => (
              <div key={u.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{u.name}</h3>
                        {u.id === currentUserId && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Anda</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role]}`}>
                          {getRoleLabel(u.role)}
                        </span>
                        {u.isActive ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3.5 h-3.5" /> Aktif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="w-3.5 h-3.5" /> Nonaktif
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{u.email}</p>
                      {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                      <p className="text-xs text-slate-300 mt-0.5">Bergabung {formatDateTime(u.createdAt)}</p>
                    </div>
                  </div>
                  {u.id !== currentUserId && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(u)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteConfirm(u)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Legend */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" /> Hak Akses Pengguna
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="font-semibold text-amber-800 mb-1">👑 Pemilik (Owner)</p>
            <ul className="text-xs text-amber-700 space-y-0.5">
              <li>• Akses penuh semua fitur</li>
              <li>• Kelola pengguna</li>
              <li>• Lihat semua laporan</li>
              <li>• Tambah/hapus properti</li>
            </ul>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="font-semibold text-blue-800 mb-1">📊 Manajer (Manager)</p>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li>• Kelola properti & inventori</li>
              <li>• Kelola pesanan</li>
              <li>• Lihat laporan</li>
              <li>• Kelola pelanggan</li>
            </ul>
          </div>
          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
            <p className="font-semibold text-green-800 mb-1">👤 Staf (Staff)</p>
            <ul className="text-xs text-green-700 space-y-0.5">
              <li>• Lihat inventori</li>
              <li>• Kelola pelanggan</li>
              <li>• Membuat pesanan</li>
              <li>• Melihat notifikasi</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={selectedUser ? "Edit Pengguna" : "Tambah Pengguna Baru"} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Nama lengkap pengguna" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="email@kavlingo.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {selectedUser ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"}
            </label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Minimal 6 karakter" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              <option value="staff">Staf</option>
              <option value="manager">Manajer</option>
              <option value="owner">Pemilik</option>
            </select>
          </div>
          {selectedUser && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-amber-500" />
              <label htmlFor="isActive" className="text-sm text-slate-700">Akun Aktif</label>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">Batal</button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
            {isSaving ? "Menyimpan..." : selectedUser ? "Simpan Perubahan" : "Tambah Pengguna"}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Nonaktifkan Pengguna" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-slate-700 mb-2">Yakin ingin menonaktifkan pengguna?</p>
          <p className="font-semibold text-slate-800 mb-6">{selectedUser?.name}</p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">Batal</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Nonaktifkan</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
