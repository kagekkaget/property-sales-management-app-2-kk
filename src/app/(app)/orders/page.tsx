"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Plus, Search, Edit2, Trash2, Eye, Filter
} from "lucide-react";
import Modal from "@/components/Modal";
import { ToastContainer, useToast } from "@/components/Toast";
import {
  formatCurrency, formatDate, formatDateTime,
  getStatusLabel, getStatusColor
} from "@/lib/utils";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  paidAmount: string;
  commission: string | null;
  notes: string | null;
  orderDate: string;
  completedDate: string | null;
  customer: { id: number; name: string; phone: string; email: string | null } | null;
  property: { id: number; name: string; code: string; type: string; price: string } | null;
}

interface Customer { id: number; name: string; phone: string; }
interface Property { id: number; name: string; code: string; price: string; }

const orderStatuses = ["pending", "confirmed", "processing", "completed", "cancelled"];
const paymentStatuses = ["unpaid", "partial", "paid", "refunded"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userRole, setUserRole] = useState<string>("staff");

  const [addForm, setAddForm] = useState({
    customerId: "", propertyId: "", totalAmount: "", paidAmount: "0",
    commission: "", notes: "", status: "pending", paymentStatus: "unpaid",
  });
  const [editForm, setEditForm] = useState({
    status: "pending", paymentStatus: "unpaid", paidAmount: "0",
    commission: "", notes: "", completedDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersRes, customersRes, propertiesRes] = await Promise.all([
        fetch("/api/orders"), fetch("/api/customers"), fetch("/api/properties"),
      ]);
      const [ordersData, customersData, propertiesData] = await Promise.all([
        ordersRes.json(), customersRes.json(), propertiesRes.json(),
      ]);
      setOrders(ordersData.orders || []);
      setCustomers(customersData.customers || []);
      setProperties(propertiesData.properties || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.user?.role || "staff"));
  }, [fetchAll]);

  // Auto-fill price when property selected
  useEffect(() => {
    if (addForm.propertyId) {
      const prop = properties.find(p => p.id.toString() === addForm.propertyId);
      if (prop) setAddForm(f => ({ ...f, totalAmount: prop.price }));
    }
  }, [addForm.propertyId, properties]);

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name.toLowerCase().includes(search.toLowerCase())) ||
      (o.property?.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !filterStatus || o.status === filterStatus;
    const matchPayment = !filterPayment || o.paymentStatus === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  const handleAdd = async () => {
    if (!addForm.customerId || !addForm.propertyId || !addForm.totalAmount) {
      addToast("Pelanggan, properti, dan harga wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          totalAmount: parseFloat(addForm.totalAmount),
          paidAmount: parseFloat(addForm.paidAmount || "0"),
          commission: addForm.commission ? parseFloat(addForm.commission) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || "Gagal membuat pesanan", "error"); return; }
      addToast("Pesanan berhasil dibuat", "success");
      setIsModalOpen(false);
      setAddForm({ customerId: "", propertyId: "", totalAmount: "", paidAmount: "0", commission: "", notes: "", status: "pending", paymentStatus: "unpaid" });
      fetchAll();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOpen = (o: Order) => {
    setSelectedOrder(o);
    setEditForm({
      status: o.status, paymentStatus: o.paymentStatus,
      paidAmount: o.paidAmount, commission: o.commission || "",
      notes: o.notes || "",
      completedDate: o.completedDate ? new Date(o.completedDate).toISOString().split("T")[0] : "",
    });
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          paidAmount: parseFloat(editForm.paidAmount || "0"),
          commission: editForm.commission ? parseFloat(editForm.commission) : null,
        }),
      });
      if (!res.ok) { addToast("Gagal memperbarui pesanan", "error"); return; }
      addToast("Pesanan berhasil diperbarui", "success");
      setIsEditOpen(false);
      fetchAll();
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = (o: Order) => {
    setSelectedOrder(o);
    setIsViewOpen(true);
  };

  const handleDeleteConfirm = (o: Order) => {
    setSelectedOrder(o);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    const res = await fetch(`/api/orders/${selectedOrder.id}`, { method: "DELETE" });
    if (!res.ok) { addToast("Gagal menghapus pesanan", "error"); return; }
    addToast("Pesanan berhasil dihapus", "success");
    setIsDeleteOpen(false);
    fetchAll();
  };

  const canDelete = userRole === "owner" || userRole === "manager";

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-amber-500" /> Manajemen Pesanan
          </h1>
          <p className="text-slate-500 text-sm mt-1">{orders.length} total pesanan</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Buat Pesanan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor pesanan, pelanggan..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
            <option value="">Semua Status</option>
            {orderStatuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
            <option value="">Semua Pembayaran</option>
            {paymentStatuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
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
            <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Tidak ada pesanan ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">No. Pesanan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pelanggan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Properti</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pembayaran</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-sm">{o.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-700">{o.customer?.name || "-"}</p>
                      <p className="text-xs text-slate-400">{o.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{o.property?.name || "-"}</p>
                      <p className="text-xs text-slate-400">{o.property?.code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 text-sm">{formatCurrency(Number(o.totalAmount))}</p>
                      <p className="text-xs text-slate-400">Dibayar: {formatCurrency(Number(o.paidAmount))}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(o.status)}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(o.paymentStatus)}`}>
                        {getStatusLabel(o.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-500">{formatDate(o.orderDate)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(o)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEditOpen(o)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDeleteConfirm(o)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Pesanan Baru" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pelanggan *</label>
            <select value={addForm.customerId} onChange={e => setAddForm({ ...addForm, customerId: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              <option value="">-- Pilih Pelanggan --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Properti *</label>
            <select value={addForm.propertyId} onChange={e => setAddForm({ ...addForm, propertyId: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              <option value="">-- Pilih Properti --</option>
              {properties.filter(p => p).map(p => <option key={p.id} value={p.id}>{p.name} ({p.code}) - {formatCurrency(Number(p.price))}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Total Harga (Rp) *</label>
            <input type="number" value={addForm.totalAmount} onChange={e => setAddForm({ ...addForm, totalAmount: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dibayar (Rp)</label>
            <input type="number" value={addForm.paidAmount} onChange={e => setAddForm({ ...addForm, paidAmount: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Komisi (Rp)</label>
            <input type="number" value={addForm.commission} onChange={e => setAddForm({ ...addForm, commission: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Opsional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              {orderStatuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Pembayaran</label>
            <select value={addForm.paymentStatus} onChange={e => setAddForm({ ...addForm, paymentStatus: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              {paymentStatuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <textarea value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Catatan pesanan..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">Batal</button>
          <button onClick={handleAdd} disabled={isSaving}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
            {isSaving ? "Membuat..." : "Buat Pesanan"}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Perbarui Status Pesanan" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Pesanan</label>
            <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              {orderStatuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Pembayaran</label>
            <select value={editForm.paymentStatus} onChange={e => setEditForm({ ...editForm, paymentStatus: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
              {paymentStatuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Dibayar (Rp)</label>
            <input type="number" value={editForm.paidAmount} onChange={e => setEditForm({ ...editForm, paidAmount: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Komisi (Rp)</label>
            <input type="number" value={editForm.commission} onChange={e => setEditForm({ ...editForm, commission: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Opsional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
            <input type="date" value={editForm.completedDate} onChange={e => setEditForm({ ...editForm, completedDate: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setIsEditOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">Batal</button>
          <button onClick={handleEdit} disabled={isSaving}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Detail Pesanan" size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800">{selectedOrder.orderNumber}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <p className="text-sm text-slate-500">Tanggal: {formatDateTime(selectedOrder.orderDate)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Pelanggan</label>
                <p className="text-sm font-semibold text-slate-800">{selectedOrder.customer?.name}</p>
                <p className="text-xs text-slate-500">{selectedOrder.customer?.phone}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Properti</label>
                <p className="text-sm font-semibold text-slate-800">{selectedOrder.property?.name}</p>
                <p className="text-xs text-slate-500">{selectedOrder.property?.code}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Total Harga</label>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(Number(selectedOrder.totalAmount))}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Sudah Dibayar</label>
                <p className="text-sm font-bold text-green-600">{formatCurrency(Number(selectedOrder.paidAmount))}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Sisa</label>
                <p className="text-sm font-bold text-red-500">{formatCurrency(Number(selectedOrder.totalAmount) - Number(selectedOrder.paidAmount))}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Komisi</label>
                <p className="text-sm font-semibold text-slate-700">{selectedOrder.commission ? formatCurrency(Number(selectedOrder.commission)) : "-"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Status Bayar</label>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(selectedOrder.paymentStatus)}`}>
                  {getStatusLabel(selectedOrder.paymentStatus)}
                </span>
              </div>
              {selectedOrder.completedDate && (
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Tanggal Selesai</label>
                  <p className="text-sm text-slate-700">{formatDate(selectedOrder.completedDate)}</p>
                </div>
              )}
              {selectedOrder.notes && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Catatan</label>
                  <p className="text-sm text-slate-700">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Hapus Pesanan" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-slate-700 mb-2">Yakin ingin menghapus pesanan?</p>
          <p className="font-semibold text-slate-800 mb-6">{selectedOrder?.orderNumber}</p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">Batal</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">Hapus</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
