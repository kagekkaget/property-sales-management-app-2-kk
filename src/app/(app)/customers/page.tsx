"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Search, Edit2, Trash2, Eye, Phone, Mail, MapPin, Wallet
} from "lucide-react";
import Modal from "@/components/Modal";
import { ToastContainer, useToast } from "@/components/Toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  nik: string | null;
  occupation: string | null;
  budget: string | null;
  preferences: string | null;
  notes: string | null;
  createdAt: string;
}

const emptyForm = {
  name: "", email: "", phone: "", address: "", nik: "", occupation: "", budget: "", notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.nik && c.nik.includes(search));
  });

  const handleAdd = () => {
    setSelectedCustomer(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setForm({
      name: c.name, email: c.email || "", phone: c.phone,
      address: c.address || "", nik: c.nik || "", occupation: c.occupation || "",
      budget: c.budget || "", notes: c.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleView = (c: Customer) => {
    setSelectedCustomer(c);
    setIsViewOpen(true);
  };

  const handleDeleteConfirm = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      addToast("Nama dan nomor telepon wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    try {
      const url = selectedCustomer ? `/api/customers/${selectedCustomer.id}` : "/api/customers";
      const method = selectedCustomer ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: form.budget ? parseFloat(form.budget) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Terjadi kesalahan", "error"); return; }
      addToast(selectedCustomer ? "Pelanggan berhasil diperbarui" : "Pelanggan berhasil ditambah", "success");
      setIsModalOpen(false);
      fetchCustomers();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, { method: "DELETE" });
      if (!res.ok) { addToast("Gagal menghapus pelanggan", "error"); return; }
      addToast("Pelanggan berhasil dihapus", "success");
      setIsDeleteOpen(false);
      fetchCustomers();
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
            <Users className="w-7 h-7 text-amber-500" /> Manajemen Pelanggan
          </h1>
          <p className="text-slate-500 text-sm mt-1">{customers.length} pelanggan terdaftar</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tambah Pelanggan
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, telepon, email, atau NIK..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Tidak ada pelanggan ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{c.name}</h3>
                    {c.occupation && <p className="text-xs text-slate-400">{c.occupation}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleView(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteConfirm(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.address}</span>
                  </div>
                )}
                {c.budget && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Wallet className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-green-600">{formatCurrency(Number(c.budget))}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-3">Bergabung {formatDate(c.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Nama lengkap pelanggan" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon *</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="email@contoh.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NIK</label>
            <input value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Nomor Induk Kependudukan" maxLength={16} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pekerjaan</label>
            <input value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Pekerjaan pelanggan" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget (Rp)</label>
            <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="500000000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Alamat lengkap pelanggan" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Preferensi atau catatan tambahan..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">Batal</button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
            {isSaving ? "Menyimpan..." : selectedCustomer ? "Simpan Perubahan" : "Tambah Pelanggan"}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Detail Pelanggan" size="md">
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">{selectedCustomer.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{selectedCustomer.name}</h3>
                {selectedCustomer.occupation && <p className="text-sm text-slate-500">{selectedCustomer.occupation}</p>}
                <p className="text-xs text-slate-400">Bergabung {formatDate(selectedCustomer.createdAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-slate-400 uppercase">Telepon</label><p className="text-sm font-medium text-slate-800">{selectedCustomer.phone}</p></div>
              <div><label className="text-xs font-medium text-slate-400 uppercase">Email</label><p className="text-sm font-medium text-slate-800">{selectedCustomer.email || "-"}</p></div>
              <div><label className="text-xs font-medium text-slate-400 uppercase">NIK</label><p className="text-sm font-medium text-slate-800">{selectedCustomer.nik || "-"}</p></div>
              <div><label className="text-xs font-medium text-slate-400 uppercase">Budget</label><p className="text-sm font-semibold text-green-600">{selectedCustomer.budget ? formatCurrency(Number(selectedCustomer.budget)) : "-"}</p></div>
              <div className="col-span-2"><label className="text-xs font-medium text-slate-400 uppercase">Alamat</label><p className="text-sm text-slate-800">{selectedCustomer.address || "-"}</p></div>
              {selectedCustomer.notes && <div className="col-span-2"><label className="text-xs font-medium text-slate-400 uppercase">Catatan</label><p className="text-sm text-slate-700">{selectedCustomer.notes}</p></div>}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Hapus Pelanggan" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-slate-700 mb-2">Yakin ingin menghapus pelanggan?</p>
          <p className="font-semibold text-slate-800 mb-4">{selectedCustomer?.name}</p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">Batal</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Hapus</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
