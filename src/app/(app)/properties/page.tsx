"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Plus, Search, Edit2, Trash2, Filter, Eye,
  AlertTriangle, Calendar, Package
} from "lucide-react";
import Modal from "@/components/Modal";
import { ToastContainer, useToast } from "@/components/Toast";
import {
  formatCurrency, formatDate, getStatusLabel, getStatusColor,
  getTypeLabel, getDaysUntilExpiry
} from "@/lib/utils";

interface Property {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: string;
  address: string;
  area: string | null;
  price: string;
  pricePerMeter: string | null;
  stock: number;
  minStock: number;
  status: string;
  expiryDate: string | null;
  features: string | null;
  createdAt: string;
}

const propertyTypes = ["rumah", "apartemen", "ruko", "tanah", "villa", "gudang", "kantor"];
const statusOptions = ["tersedia", "terjual", "disewa", "pending", "tidak_tersedia"];

const emptyForm = {
  name: "", description: "", type: "rumah", address: "", area: "",
  price: "", pricePerMeter: "", stock: "1", minStock: "1",
  status: "tersedia", expiryDate: "", imageUrl: "",
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("staff");
  const { toasts, addToast, removeToast } = useToast();

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/properties");
      const data = await res.json();
      setProperties(data.properties || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchProperties();
      const res = await fetch("/api/auth/me");
      const d = await res.json();
      setUserRole(d.user?.role || "staff");
    };
    loadData();
  }, []);

  const filtered = properties.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchType = !filterType || p.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleAdd = () => {
    setSelectedProperty(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (p: Property) => {
    setSelectedProperty(p);
    setForm({
      name: p.name,
      description: p.description || "",
      type: p.type,
      address: p.address,
      area: p.area || "",
      price: p.price,
      pricePerMeter: p.pricePerMeter || "",
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      status: p.status,
      expiryDate: p.expiryDate || "",
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleView = (p: Property) => {
    setSelectedProperty(p);
    setIsViewOpen(true);
  };

  const handleDeleteConfirm = (p: Property) => {
    setSelectedProperty(p);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.address || !form.price) {
      addToast("Nama, alamat, dan harga wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    try {
      const url = selectedProperty ? `/api/properties/${selectedProperty.id}` : "/api/properties";
      const method = selectedProperty ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          pricePerMeter: form.pricePerMeter ? parseFloat(form.pricePerMeter) : null,
          area: form.area ? parseFloat(form.area) : null,
          stock: parseInt(form.stock),
          minStock: parseInt(form.minStock),
          expiryDate: form.expiryDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Terjadi kesalahan", "error"); return; }
      addToast(selectedProperty ? "Properti berhasil diperbarui" : "Properti berhasil ditambah", "success");
      setIsModalOpen(false);
      fetchProperties();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProperty) return;
    try {
      const res = await fetch(`/api/properties/${selectedProperty.id}`, { method: "DELETE" });
      if (!res.ok) { addToast("Gagal menghapus properti", "error"); return; }
      addToast("Properti berhasil dihapus", "success");
      setIsDeleteOpen(false);
      fetchProperties();
    } catch {
      addToast("Terjadi kesalahan", "error");
    }
  };

  const canEdit = userRole === "owner" || userRole === "manager";

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-500" />
            Inventori Properti
          </h1>
          <p className="text-slate-500 text-sm mt-1">{properties.length} properti terdaftar</p>
        </div>
        {canEdit && (
          <button onClick={handleAdd} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Tambah Properti
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, kode, atau alamat..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
            <option value="">Semua Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
            <option value="">Semua Tipe</option>
            {propertyTypes.map(t => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Tidak ada properti ditemukan</p>
            <p className="text-slate-300 text-sm mt-1">Tambahkan properti baru atau ubah filter pencarian</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Properti</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Harga</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stok</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kadaluarsa</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => {
                  const daysLeft = getDaysUntilExpiry(p.expiryDate);
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
                  const isExpired = daysLeft !== null && daysLeft < 0;
                  const isLowStock = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.code}</p>
                            <p className="text-xs text-slate-400 truncate max-w-48">{p.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{getTypeLabel(p.type)}</span>
                        {p.area && <p className="text-xs text-slate-400">{p.area} m²</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 text-sm">{formatCurrency(Number(p.price))}</p>
                        {p.pricePerMeter && <p className="text-xs text-slate-400">{formatCurrency(Number(p.pricePerMeter))}/m²</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className={`font-semibold text-sm ${isLowStock ? "text-red-600" : "text-slate-700"}`}>
                            {p.stock}
                          </span>
                          <span className="text-xs text-slate-400">unit</span>
                          {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </div>
                        <p className="text-xs text-slate-400">Min: {p.minStock}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.expiryDate ? (
                          <div>
                            <p className={`text-xs font-medium flex items-center gap-1 ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-slate-600"}`}>
                              {(isExpired || isExpiringSoon) && <AlertTriangle className="w-3 h-3" />}
                              {formatDate(p.expiryDate)}
                            </p>
                            {isExpired && <p className="text-xs text-red-500">Sudah berakhir</p>}
                            {isExpiringSoon && !isExpired && <p className="text-xs text-amber-500">{daysLeft} hari lagi</p>}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteConfirm(p)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={selectedProperty ? "Edit Properti" : "Tambah Properti Baru"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Properti *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Contoh: Rumah Mewah Jl. Sudirman" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipe *</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              {propertyTypes.map(t => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              {statusOptions.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat *</label>
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Alamat lengkap properti" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp) *</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="500000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga/m² (Rp)</label>
            <input type="number" value={form.pricePerMeter} onChange={e => setForm({ ...form, pricePerMeter: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="5000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Luas (m²)</label>
            <input type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stok (Unit)</label>
            <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stok</label>
            <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Kadaluarsa Listing</label>
            <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Deskripsi properti..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
            Batal
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60 transition-colors">
            {isSaving ? "Menyimpan..." : selectedProperty ? "Simpan Perubahan" : "Tambah Properti"}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Detail Properti" size="lg">
        {selectedProperty && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Kode</label>
                <p className="text-sm font-semibold text-slate-800">{selectedProperty.code}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Status</label>
                <p><span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(selectedProperty.status)}`}>{getStatusLabel(selectedProperty.status)}</span></p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Nama</label>
                <p className="text-sm font-semibold text-slate-800">{selectedProperty.name}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Alamat</label>
                <p className="text-sm text-slate-700">{selectedProperty.address}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Tipe</label>
                <p className="text-sm text-slate-700">{getTypeLabel(selectedProperty.type)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Luas</label>
                <p className="text-sm text-slate-700">{selectedProperty.area ? `${selectedProperty.area} m²` : "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Harga</label>
                <p className="text-sm font-semibold text-slate-800">{formatCurrency(Number(selectedProperty.price))}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Harga/m²</label>
                <p className="text-sm text-slate-700">{selectedProperty.pricePerMeter ? formatCurrency(Number(selectedProperty.pricePerMeter)) : "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Stok</label>
                <p className="text-sm text-slate-700">{selectedProperty.stock} unit (Min: {selectedProperty.minStock})</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Kadaluarsa</label>
                <p className="text-sm text-slate-700">{selectedProperty.expiryDate ? formatDate(selectedProperty.expiryDate) : "-"}</p>
              </div>
              {selectedProperty.description && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Deskripsi</label>
                  <p className="text-sm text-slate-700">{selectedProperty.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Hapus Properti" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-slate-700 mb-2">Yakin ingin menghapus properti?</p>
          <p className="font-semibold text-slate-800 mb-4">{selectedProperty?.name}</p>
          <p className="text-sm text-slate-400 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">Batal</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Hapus</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
