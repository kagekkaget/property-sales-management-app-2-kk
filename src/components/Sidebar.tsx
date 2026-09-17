"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShoppingCart,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCog,
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  alertCount?: number;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "staff"] },
  { href: "/properties", label: "Inventori Properti", icon: Building2, roles: ["owner", "manager", "staff"] },
  { href: "/customers", label: "Pelanggan", icon: Users, roles: ["owner", "manager", "staff"] },
  { href: "/orders", label: "Pesanan", icon: ShoppingCart, roles: ["owner", "manager", "staff"] },
  { href: "/reports", label: "Laporan", icon: BarChart3, roles: ["owner", "manager"] },
  { href: "/alerts", label: "Notifikasi", icon: Bell, roles: ["owner", "manager", "staff"] },
  { href: "/users", label: "Kelola Pengguna", icon: UserCog, roles: ["owner"] },
];

const roleLabels: Record<string, string> = {
  owner: "Pemilik",
  manager: "Manajer",
  staff: "Staf",
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800",
  manager: "bg-blue-100 text-blue-800",
  staff: "bg-green-100 text-green-800",
};

export default function Sidebar({ user, alertCount = 0 }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Kavlingo</h1>
            <p className="text-slate-400 text-xs">Palembang</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role] || "bg-gray-100 text-gray-800"}`}>
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/alerts" && alertCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
              {isActive && <ChevronRight className="w-4 h-4 text-white" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-900/40 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Kavlingo Palembang</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-300 hover:text-white p-1"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 z-40 bg-slate-800 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="pt-16">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 bg-slate-800 flex-col h-screen sticky top-0">
        <SidebarContent />
      </div>
    </>
  );
}
