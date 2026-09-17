"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, AlertTriangle, Calendar, CheckCircle, Package } from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";
import { formatDateTime } from "@/lib/utils";

interface Alert {
  id: number;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  property: { id: number; name: string; code: string } | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toasts, addToast, removeToast } = useToast();

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAlerts = async () => {
      await fetchAlerts();
    };
    loadAlerts();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
      addToast("Notifikasi ditandai sudah dibaca", "success");
    } catch {
      addToast("Gagal memperbarui notifikasi", "error");
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.isRead);
    for (const alert of unread) {
      await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alert.id }),
      });
    }
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    addToast("Semua notifikasi ditandai sudah dibaca", "success");
  };

  const filtered = alerts.filter(a => {
    if (filter === "unread") return !a.isRead;
    if (filter === "low_stock") return a.alertType === "low_stock";
    if (filter === "expiring") return a.alertType === "expiring";
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const getAlertIcon = (type: string) => {
    if (type === "low_stock") return <Package className="w-5 h-5 text-orange-500" />;
    if (type === "expiring") return <Calendar className="w-5 h-5 text-amber-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getAlertColor = (type: string, isRead: boolean) => {
    if (isRead) return "border-slate-100 bg-white";
    if (type === "low_stock") return "border-orange-200 bg-orange-50";
    if (type === "expiring") return "border-amber-200 bg-amber-50";
    return "border-red-200 bg-red-50";
  };

  const getAlertTypeLabel = (type: string) => {
    if (type === "low_stock") return "Stok Rendah";
    if (type === "expiring") return "Akan Kadaluarsa";
    return "Peringatan";
  };

  const getAlertTypeBadge = (type: string) => {
    if (type === "low_stock") return "bg-orange-100 text-orange-700";
    if (type === "expiring") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500" />
            Notifikasi & Peringatan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
            <CheckCircle className="w-4 h-4" /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2.5 rounded-xl"><Bell className="w-5 h-5 text-red-500" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{unreadCount}</p>
              <p className="text-sm text-slate-500">Belum Dibaca</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2.5 rounded-xl"><Package className="w-5 h-5 text-orange-500" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{alerts.filter(a => a.alertType === "low_stock" && !a.isRead).length}</p>
              <p className="text-sm text-slate-500">Stok Rendah</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2.5 rounded-xl"><Calendar className="w-5 h-5 text-amber-500" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{alerts.filter(a => a.alertType === "expiring" && !a.isRead).length}</p>
              <p className="text-sm text-slate-500">Akan Kadaluarsa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100 px-4">
          {[
            { key: "all", label: "Semua" },
            { key: "unread", label: "Belum Dibaca" },
            { key: "low_stock", label: "Stok Rendah" },
            { key: "expiring", label: "Akan Kadaluarsa" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${filter === tab.key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Memuat notifikasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Tidak ada notifikasi</p>
            <p className="text-slate-300 text-sm mt-1">Semua berjalan dengan baik! 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((alert) => (
              <div key={alert.id} className={`p-4 transition-colors hover:bg-slate-50/50 ${!alert.isRead ? "relative" : ""}`}>
                <div className="flex items-start gap-4">
                  {/* Alert icon */}
                  <div className={`p-2 rounded-xl flex-shrink-0 ${alert.isRead ? "bg-slate-100" : alert.alertType === "low_stock" ? "bg-orange-100" : "bg-amber-100"}`}>
                    {getAlertIcon(alert.alertType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getAlertTypeBadge(alert.alertType)}`}>
                            {getAlertTypeLabel(alert.alertType)}
                          </span>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        <p className={`text-sm ${alert.isRead ? "text-slate-500" : "text-slate-800 font-medium"}`}>
                          {alert.message}
                        </p>
                        {alert.property && (
                          <p className="text-xs text-slate-400 mt-1">
                            Properti: {alert.property.name} ({alert.property.code})
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{formatDateTime(alert.createdAt)}</p>
                      </div>
                      {!alert.isRead && (
                        <button onClick={() => handleMarkRead(alert.id)}
                          className="flex-shrink-0 text-xs text-amber-600 hover:text-amber-700 font-medium px-3 py-1.5 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors">
                          Tandai Dibaca
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
