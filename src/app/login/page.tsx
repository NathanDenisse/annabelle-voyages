"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin");
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code === "auth/invalid-credential"
        ? "Email ou mot de passe incorrect."
        : "Erreur de connexion. Veuillez réessayer.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blush-100 rounded-full opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-terracotta-400/10 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-light text-brown-900 mb-1">
            Annabelle Voyages
          </h1>
          <p className="font-sans text-sm text-brown-400">Administration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blush-100 p-8">
          <h2 className="font-serif text-xl font-medium text-brown-900 mb-6 text-center">
            Connexion
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block font-sans text-sm font-medium text-brown-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-cream-100 border border-blush-200 rounded-xl font-sans text-sm text-brown-900 placeholder-brown-300 focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-sans text-sm font-medium text-brown-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-cream-100 border border-blush-200 rounded-xl font-sans text-sm text-brown-900 placeholder-brown-300 focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brown-300 hover:text-brown-500"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-sans font-medium py-3.5 rounded-xl transition-colors duration-200 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-sans text-xs text-brown-300">
          ← Retour au{" "}
          <a href="/" className="text-terracotta-400 hover:text-terracotta-500 transition-colors">
            site vitrine
          </a>
        </p>
      </motion.div>
    </div>
  );
}
