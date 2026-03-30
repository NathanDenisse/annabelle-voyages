"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, LayoutDashboard, Image, Handshake, FileText, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useFirestore";
import AdminSidebar from "@/components/admin/AdminSidebar";

const bottomNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/portfolio", label: "Portfolio", icon: Image },
  { href: "/admin/partnerships", label: "Partenariats", icon: Handshake },
  { href: "/admin/content", label: "Contenu", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useMessages();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-layout flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0 h-screen sticky top-0">
        <div className="w-full h-full">
          <AdminSidebar unreadCount={unreadCount} />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 md:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar
          unreadCount={unreadCount}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-blush-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-brown-600 hover:bg-blush-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-serif text-lg font-medium text-brown-900">
            Annabelle Voyages
          </h1>
          <div className="w-11" />
        </div>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-blush-100 safe-area-bottom">
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isMessages = item.href === "/admin/messages";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-colors min-h-[56px] ${
                  isActive
                    ? "text-terracotta-500"
                    : "text-brown-400 active:text-brown-600"
                }`}
              >
                <div className="relative">
                  <Icon size={20} />
                  {isMessages && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-terracotta-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="font-sans text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
