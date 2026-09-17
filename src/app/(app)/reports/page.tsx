"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Download, FileText, Table, Building2, Users, ShoppingCart } from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";
import { formatCurrency, formatDate, getStatusLabel, getTypeLabel } from "@/lib/utils";

type ReportType = "inventory" | "sales" | "customers";

interface InventoryItem {
  id: number; code: string; name: string; type: string;
  price: string; stock: number; status: string; expiryDate: string | null;
  address: string; area: string | null; createdAt: string;
}

interface SalesItem {
  id: number; orderNumber: string; status: string; paymentStatus: string;
  totalAmount: string; paidAmount: string; commission: string | null;
  orderDate: string; completedDate: string | null;
  customerName: string | null; customerPhone: string | null;
  propertyName: string | null; propertyCode: string | null; propertyType: string | null;
}

interface CustomerItem {
  id: number; name: string; phone: string; email: string | null;
  occupation: string | null; budget: string | null; createdAt: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("inventory");
  const [data, setData] = useState<(InventoryItem | SalesItem | CustomerItem)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchReport = useCallback(async (type: ReportType) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${type}`);
      const d = await res.json();
      setData(d.data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(reportType); }, [fetchReport, reportType]);

  const handleExportCSV = () => {
    if (data.length === 0) { addToast("Tidak ada data untuk diekspor", "warning"); return; }

    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === "inventory") {
      headers = ["Kode", "Nama", "Tipe", "Harga", "Stok", "Status", "Alamat", "Luas (m²)", "Kadaluarsa", "Dibuat"];
      rows = (data as InventoryItem[]).map(i => [
        i.code, i.name, getTypeLabel(i.type),
        Number(i.price).toString(), i.stock.toString(),
        getStatusLabel(i.status), i.address, i.area || "",
        i.expiryDate ? formatDate(i.expiryDate) : "", formatDate(i.createdAt),
      ]);
    } else if (reportType === "sales") {
      headers = ["No. Pesanan", "Pelanggan", "Telepon", "Properti", "Kode", "Total", "Dibayar", "Status", "Pembayaran", "Tanggal"];
      rows = (data as SalesItem[]).map(i => [
        i.orderNumber, i.customerName || "", i.customerPhone || "",
        i.propertyName || "", i.propertyCode || "",
        Number(i.totalAmount).toString(), Number(i.paidAmount).toString(),
        getStatusLabel(i.status), getStatusLabel(i.paymentStatus),
        formatDate(i.orderDate),
      ]);
    } else {
      headers = ["Nama", "Telepon", "Email", "Pekerjaan", "Budget", "Bergabung"];
      rows = (data as CustomerItem[]).map(i => [
        i.name, i.phone, i.email || "", i.occupation || "",
        i.budget ? Number(i.budget).toString() : "",
        formatDate(i.createdAt),
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kavlingo-${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("File CSV berhasil diunduh", "success");
  };

  const handleExportPDF = async () => {
    if (data.length === 0) { addToast("Tidak ada data untuk diekspor", "warning"); return; }
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });

      const titles: Record<ReportType, string> = {
        inventory: "Laporan Inventori Properti",
        sales: "Laporan Penjualan",
        customers: "Laporan Pelanggan",
      };

      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text("Kavlingo Palembang", 14, 15);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(titles[reportType], 14, 23);
      doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 30);

      let head: string[][] = [];
      let body: string[][] = [];

      if (reportType === "inventory") {
        head = [["Kode", "Nama", "Tipe", "Harga (Rp)", "Stok", "Status", "Kadaluarsa"]];
        body = (data as InventoryItem[]).map(i => [
          i.code, i.name, getTypeLabel(i.type),
          formatCurrency(Number(i.price)), i.stock.toString(),
          getStatusLabel(i.status), i.expiryDate ? formatDate(i.expiryDate) : "-",
        ]);
      } else if (reportType === "sales") {
        head = [["No. Pesanan", "Pelanggan", "Properti", "Total (Rp)", "Dibayar (Rp)", "Status", "Tgl Pesanan"]];
        body = (data as SalesItem[]).map(i => [
          i.orderNumber, i.customerName || "-", i.propertyName || "-",
          formatCurrency(Number(i.totalAmount)), formatCurrency(Number(i.paidAmount)),
          getStatusLabel(i.status), formatDate(i.orderDate),
        ]);
      } else {
        head = [["Nama", "Telepon", "Email", "Pekerjaan", "Budget (Rp)", "Bergabung"]];
        body = (data as CustomerItem[]).map(i => [
          i.name, i.phone, i.email || "-", i.occupation || "-",
          i.budget ? formatCurrency(Number(i.budget)) : "-",
          formatDate(i.createdAt),
        ]);
      }

      autoTable(doc, {
        head,
        body,
        startY: 38,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`kavlingo-${reportType}-${new Date().toISOString().split("T")[0]}.pdf`);
      addToast("File PDF berhasil diunduh", "success");
    } catch (e) {
      console.error(e);
      addToast("Gagal membuat PDF", "error");
    }
  };

  const reportTabs = [
    { key: "inventory" as ReportType, label: "Inventori Properti", icon: Building2 },
    { key: "sales" as ReportType, label: "Penjualan", icon: ShoppingCart },
    { key: "customers" as ReportType, label: "Pelanggan", icon: Users },
  ];

  // Summary stats
  const inventoryData = data as InventoryItem[];
  const salesData = data as SalesItem[];
  const customerData = data as CustomerItem[];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-amber-500" /> Laporan
          </h1>
          <p className="text-slate-500 text-sm mt-1">Generate dan ekspor laporan data</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
            <Table className="w-4 h-4 text-green-600" /> Ekspor CSV
          </button>
          <button onClick={handleExportPDF}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
            <FileText className="w-4 h-4" /> Ekspor PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {reportType === "inventory" && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-slate-800">{inventoryData.length}</p>
            <p className="text-sm text-slate-500">Total Properti</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{inventoryData.filter(i => i.status === "tersedia").length}</p>
            <p className="text-sm text-slate-500">Tersedia</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{inventoryData.filter(i => i.status === "terjual").length}</p>
            <p className="text-sm text-slate-500">Terjual</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(inventoryData.reduce((sum, i) => sum + Number(i.price), 0))}</p>
            <p className="text-sm text-slate-500">Total Nilai</p>
          </div>
        </div>
      )}

      {reportType === "sales" && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-slate-800">{salesData.length}</p>
            <p className="text-sm text-slate-500">Total Pesanan</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{salesData.filter(i => i.status === "completed").length}</p>
            <p className="text-sm text-slate-500">Selesai</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(salesData.filter(i => i.status === "completed").reduce((sum, i) => sum + Number(i.totalAmount), 0))}</p>
            <p className="text-sm text-slate-500">Total Pendapatan</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(salesData.reduce((sum, i) => sum + (i.commission ? Number(i.commission) : 0), 0))}</p>
            <p className="text-sm text-slate-500">Total Komisi</p>
          </div>
        </div>
      )}

      {/* Report Type Tabs + Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-4">
          {reportTabs.map(tab => (
            <button key={tab.key} onClick={() => setReportType(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${reportType === tab.key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Memuat laporan...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Tidak ada data laporan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === "inventory" && (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Kode", "Nama", "Tipe", "Harga", "Stok", "Status", "Alamat", "Kadaluarsa"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(data as InventoryItem[]).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{item.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{getTypeLabel(item.type)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{formatCurrency(Number(item.price))}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.status === "tersedia" ? "bg-green-100 text-green-700" :
                          item.status === "terjual" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>{getStatusLabel(item.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{item.address}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{item.expiryDate ? formatDate(item.expiryDate) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "sales" && (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["No. Pesanan", "Pelanggan", "Properti", "Total", "Dibayar", "Status", "Pembayaran", "Tgl Pesanan"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(data as SalesItem[]).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-800">{item.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{item.customerName}</p>
                        <p className="text-xs text-slate-400">{item.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{item.propertyName}</p>
                        <p className="text-xs text-slate-400">{item.propertyCode}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{formatCurrency(Number(item.totalAmount))}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-semibold">{formatCurrency(Number(item.paidAmount))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.status === "completed" ? "bg-green-100 text-green-700" :
                          item.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{getStatusLabel(item.status)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                          item.paymentStatus === "unpaid" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{getStatusLabel(item.paymentStatus)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(item.orderDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "customers" && (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Nama", "Telepon", "Email", "Pekerjaan", "Budget", "Bergabung"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(data as CustomerItem[]).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.occupation || "-"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{item.budget ? formatCurrency(Number(item.budget)) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer */}
        {data.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Total: {data.length} item</span>
            <span>Dicetak: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
