export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `KVL-${year}${month}${day}-${random}`;
}

export function generatePropertyCode(type: string): string {
  const prefix: Record<string, string> = {
    rumah: "RMH",
    apartemen: "APT",
    ruko: "RKO",
    tanah: "TNH",
    villa: "VLA",
    gudang: "GDG",
    kantor: "KTR",
  };
  const p = prefix[type] || "PRO";
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${p}-${random}`;
}

export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    tersedia: "Tersedia",
    terjual: "Terjual",
    disewa: "Disewa",
    pending: "Pending",
    tidak_tersedia: "Tidak Tersedia",
    confirmed: "Dikonfirmasi",
    processing: "Diproses",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    unpaid: "Belum Bayar",
    partial: "Sebagian",
    paid: "Lunas",
    refunded: "Dikembalikan",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    tersedia: "bg-green-100 text-green-800",
    terjual: "bg-blue-100 text-blue-800",
    disewa: "bg-purple-100 text-purple-800",
    pending: "bg-yellow-100 text-yellow-800",
    tidak_tersedia: "bg-gray-100 text-gray-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    unpaid: "bg-red-100 text-red-800",
    partial: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    refunded: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Pemilik",
    manager: "Manajer",
    staff: "Staf",
  };
  return labels[role] || role;
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    rumah: "Rumah",
    apartemen: "Apartemen",
    ruko: "Ruko",
    tanah: "Tanah",
    villa: "Villa",
    gudang: "Gudang",
    kantor: "Kantor",
  };
  return labels[type] || type;
}
