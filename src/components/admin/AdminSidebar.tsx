"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  Handshake,
  FileText,
  MessageSquare,
  Star,
  Share2,
  LogOut,
  ChevronRight,
  Quote,
  MapPin,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/portfolio", label: "Portfolio", icon: Image },
  { href: "/admin/partnerships", label: "Partenariats", icon: Handshake },
  { href: "/admin/content", label: "Textes du site", icon: FileText },
  { href: "/admin/hero", label: "Hero", icon: Star },
  { href: "/admin/socials", label: "Réseaux sociaux", icon: Share2 },
  { href: "/admin/testimonials", label: "Témoignages", icon: Quote },
  { href: "/admin/next-trip", label: "Prochain voyage", icon: MapPin },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

interface AdminSidebarProps {
  unreadCount?: number;
  onClose?: () => void;
}

export default function AdminSidebar({ unreadCount = 0, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    toast.success("Déconnecté");
    router.push("/login");
  };

  return (
    <nav className="flex flex-col h-full bg-white border-r border-blush-100">
      {/* Brand */}
      <div className="p-6 border-b border-blush-100">
        <h1 className="font-serif text-xl font-medium text-brown-900">
          Annabelle Voyages
        </h1>
        <p className="font-sans text-xs text-brown-400 mt-0.5">Administration</p>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 group ${
                isActive
                  ? "bg-terracotta-500 text-white"
                  : "text-brown-600 hover:bg-blush-100 hover:text-brown-900"
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="font-sans text-sm font-medium flex-1">{item.label}</span>
              {item.href === "/admin/messages" && unreadCount > 0 && (
                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                  isActive ? "bg-white text-terracotta-500" : "bg-terracotta-500 text-white"
                }`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-blush-100">
        <Link
          href="/"
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brown-400 hover:text-brown-600 hover:bg-blush-100 transition-colors mb-1"
        >
          <ChevronRight size={16} />
          <span className="font-sans text-sm">Voir le site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-brown-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          <span className="font-sans text-sm">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
