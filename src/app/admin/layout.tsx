"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useFirestore";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
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
        <div className="md:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-blush-100 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-brown-600 hover:bg-blush-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-serif text-lg font-medium text-brown-900">
            Annabelle Voyages
          </h1>
          <div className="w-9" />
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
