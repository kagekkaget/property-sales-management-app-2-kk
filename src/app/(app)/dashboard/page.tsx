"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  Clock,
  Bell,
  Activity,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from "@/lib/utils";
import Link from "next/link";

interface DashboardData {
  stats: {
    totalProperties: number;
    availableProperties: number;
    soldProperties: number;
    totalCustomers: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: string | number;
    unreadAlerts: number;
  };
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: string;
    orderDate: string;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    entity: string;
    description: string;
    createdAt: string;
  }>;
}

const actionLabels: Record<string, string> = {
  CREATE: "Membuat",
  UPDATE: "Mengubah",
  DELETE: "Menghapus",
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Selamat datang di Kavlingo Palembang</p>
      </div>

      {/* Alert Banner */}
      {stats && stats.unreadAlerts > 0 && (
        <Link href="/alerts">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-100 transition-colors cursor-pointer">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                {stats.unreadAlerts} notifikasi belum dibaca
              </p>
              <p className="text-amber-600 text-sm">Klik untuk melihat peringatan stok dan listing</p>
            </div>
            <span className="text-amber-600 text-sm font-medium">Lihat →</span>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Properti"
          value={stats?.totalProperties || 0}
          subtitle={`${stats?.availableProperties || 0} tersedia`}
          icon={<Building2 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pelanggan"
          value={stats?.totalCustomers || 0}
          subtitle="Total terdaftar"
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Pesanan"
          value={stats?.totalOrders || 0}
          subtitle={`${stats?.pendingOrders || 0} pending`}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="amber"
        />
        <StatCard
          title="Total Pendapatan"
          value={formatCurrency(Number(stats?.totalRevenue || 0))}
          subtitle={`${stats?.completedOrders || 0} transaksi selesai`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Properti Tersedia"
          value={stats?.availableProperties || 0}
          icon={<Building2 className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Properti Terjual"
          value={stats?.soldProperties || 0}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pesanan Selesai"
          value={stats?.completedOrders || 0}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Pesanan Pending"
          value={stats?.pendingOrders || 0}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              Pesanan Terbaru
            </h2>
            <Link href="/orders" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Lihat Semua →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(order.orderDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 text-sm">{formatCurrency(Number(order.totalAmount))}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Belum ada pesanan</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Aktivitas Terbaru
            </h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 whitespace-nowrap ${actionColors[log.action] || "bg-gray-100 text-gray-700"}`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-tight">{log.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
