"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Image, Handshake, MessageSquare, Star, FileText, Share2, ArrowRight, HardDrive } from "lucide-react";
import { usePortfolio, usePartnerships, useMessages, useStorageTracking } from "@/hooks/useFirestore";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

function StorageWidget() {
  const { totalBytes, todayBytes, loading } = useStorageTracking();

  const maxStorage = 5 * 1024 * 1024 * 1024; // 5 Go
  const maxDaily = 1 * 1024 * 1024 * 1024; // 1 Go
  const totalPercent = Math.min((totalBytes / maxStorage) * 100, 100);
  const dailyPercent = Math.min((todayBytes / maxDaily) * 100, 100);

  const getColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-orange-400";
    return "bg-green-500";
  };

  const getTextColor = (pct: number) => {
    if (pct >= 90) return "text-red-600";
    if (pct >= 70) return "text-orange-500";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-blush-100">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive size={18} className="text-brown-400" />
          <h3 className="font-sans text-sm font-medium text-brown-700">Stockage Firebase</h3>
        </div>
        <div className="h-16 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-blush-100">
      <div className="flex items-center gap-2 mb-5">
        <HardDrive size={18} className="text-brown-400" />
        <h3 className="font-sans text-sm font-medium text-brown-700">Stockage Firebase</h3>
      </div>

      {/* Total storage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-xs text-brown-400">Total stocké</span>
          <span className={`font-sans text-xs font-medium ${getTextColor(totalPercent)}`}>
            {formatBytes(totalBytes)} / 5 Go
          </span>
        </div>
        <div className="h-2 bg-blush-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getColor(totalPercent)}`}
            style={{ width: `${totalPercent}%` }}
          />
        </div>
      </div>

      {/* Today's uploads */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-xs text-brown-400">Uploads aujourd&apos;hui</span>
          <span className={`font-sans text-xs font-medium ${getTextColor(dailyPercent)}`}>
            {formatBytes(todayBytes)} / 1 Go
          </span>
        </div>
        <div className="h-2 bg-blush-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getColor(dailyPercent)}`}
            style={{ width: `${dailyPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { items: portfolio } = usePortfolio();
  const { items: partnerships } = usePartnerships();
  const { messages, unreadCount } = useMessages();

  const stats = [
    {
      label: "Photos & Vidéos",
      value: portfolio.length,
      icon: Image,
      href: "/admin/portfolio",
      color: "bg-terracotta-400/10 text-terracotta-500",
    },
    {
      label: "Partenariats",
      value: partnerships.length,
      icon: Handshake,
      href: "/admin/partnerships",
      color: "bg-gold-400/10 text-gold-500",
    },
    {
      label: "Messages",
      value: messages.length,
      icon: MessageSquare,
      href: "/admin/messages",
      color: "bg-blush-200 text-brown-500",
      badge: unreadCount,
    },
  ];

  const quickLinks = [
    { href: "/admin/content", label: "Textes du site", icon: FileText, desc: "Tagline, bio, contact..." },
    { href: "/admin/hero", label: "Hero", icon: Star, desc: "Image de fond, tagline" },
    { href: "/admin/socials", label: "Réseaux sociaux", icon: Share2, desc: "Instagram, YouTube, TikTok" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-brown-900">Dashboard</h1>
        <p className="font-sans text-brown-400 mt-1 text-sm">
          Bienvenue dans votre espace d&apos;administration.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-2xl p-6 border border-blush-100 hover:border-terracotta-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={18} />
                </div>
                {stat.badge !== undefined && stat.badge > 0 && (
                  <span className="bg-terracotta-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="font-serif text-3xl font-medium text-brown-900">{stat.value}</p>
              <p className="font-sans text-sm text-brown-400 mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Storage Widget */}
      <div className="mb-8">
        <StorageWidget />
      </div>

      {/* Quick links */}
      <h2 className="font-serif text-xl font-medium text-brown-800 mb-4">Accès rapide</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl p-5 border border-blush-100 hover:border-terracotta-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={18} className="text-terracotta-400" />
                <ArrowRight size={14} className="text-brown-300 group-hover:text-terracotta-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="font-sans text-sm font-medium text-brown-800">{link.label}</p>
              <p className="font-sans text-xs text-brown-400 mt-0.5">{link.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Unread messages alert */}
      {unreadCount > 0 && (
        <Link
          href="/admin/messages"
          className="mt-6 flex items-center gap-3 bg-terracotta-500/10 border border-terracotta-300 rounded-2xl p-4 hover:bg-terracotta-500/15 transition-colors"
        >
          <MessageSquare size={18} className="text-terracotta-500 flex-shrink-0" />
          <p className="font-sans text-sm text-brown-700">
            <span className="font-semibold text-terracotta-600">{unreadCount} message{unreadCount > 1 ? "s" : ""}</span>{" "}
            non lu{unreadCount > 1 ? "s" : ""} en attente
          </p>
          <ArrowRight size={14} className="text-terracotta-400 ml-auto" />
        </Link>
      )}
    </div>
  );
}
