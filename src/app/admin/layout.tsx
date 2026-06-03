"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderHeart,
  Users,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Lock,
  User as UserIcon,
  AlertCircle,
  Award,
  Store,
} from "lucide-react";
import { db } from "../../lib/supabase";
import { Notification } from "../../types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    // Check local session
    if (typeof window !== "undefined") {
      const session = sessionStorage.getItem("maison_viii_admin_session");
      if (session) {
        const parsed = JSON.parse(session);
        setIsAuthenticated(true);
        setCurrentUser(parsed.user || "Administrador");
      }
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadNotifications() {
      try {
        const list = await db.getNotifications();
        setNotifications(list);
      } catch (err) {
        console.error(err);
      }
    }

    loadNotifications();

    // Poll notifications every 10 seconds for real-time CRM simulation
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUser = usernameInput.trim();

    // Validate credentials
    const credentials: Record<string, string> = {
      "Angel Pineda": "AP.maison.5575",
      "Mario Bernard": "MB.maison.2504",
    };

    if (
      credentials[normalizedUser] &&
      credentials[normalizedUser] === passwordInput
    ) {
      const sessionData = { user: normalizedUser, token: "authenticated" };
      sessionStorage.setItem(
        "maison_viii_admin_session",
        JSON.stringify(sessionData),
      );
      setIsAuthenticated(true);
      setCurrentUser(normalizedUser);
      setLoginError("");
      setUsernameInput("");
      setPasswordInput("");
    } else {
      setLoginError("Credenciales incorrectas para el CRM de Maison VIII.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("maison_viii_admin_session");
    setIsAuthenticated(false);
    setCurrentUser("");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await db.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Punto de Venta", path: "/admin/pos", icon: Store },
    { name: "Pedidos", path: "/admin/pedidos", icon: ShoppingBag },
    { name: "Productos", path: "/admin/productos", icon: FolderHeart },
    { name: "Clientes", path: "/admin/clientes", icon: Users },
    { name: "LE CLUB 8", path: "/admin/club", icon: Award },
    { name: "Configuraciones", path: "/admin/configuracion", icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen bg-[#0D140D] items-center justify-center text-[#FAF8F5]">
        <div className="animate-pulse text-center">
          <span className="editorial-title text-3xl text-gold">
            MAISON VIII
          </span>
          <p className="text-xs text-gold/60 tracking-widest mt-2">
            Verificando Autorización...
          </p>
        </div>
      </div>
    );
  }

  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen w-screen bg-[#0D140D] flex items-center justify-center px-4 overflow-hidden">
        {/* Decorative Grid and Aura */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(197,168,128,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(197,168,128,0.15)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Login Card */}
        <div className="w-full max-w-md bg-[#0A0F0A] border border-gold/25 rounded-lg shadow-2xl p-8 sm:p-10 relative z-10 space-y-8 animate-fade-in-up">
          {/* Header Branding */}
          <div className="text-center space-y-4">
            <img
              src="/logos/logo_headersinfondo_500x200.png"
              alt="Maison VIII Logo"
              className="h-16 w-auto object-contain mx-auto transition-transform duration-300"
            />
            <div className="space-y-1">
              <h2 className="editorial-title text-lg tracking-[0.1em] text-gold font-light">
                Acceso CRM Administrativo
              </h2>
              <p className="text-[10px] text-crema/40 uppercase tracking-[0.2em] font-light">
                Área de Control Exclusiva
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5 text-xs">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/25 p-3.5 rounded text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span className="font-light">{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username field */}
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                  Usuario autorizado
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded-md pl-10 pr-4 py-3 text-sm text-crema placeholder-crema/20 focus:outline-none focus:border-gold transition-colors"
                    placeholder="Ej. Juan Perez"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded-md pl-10 pr-4 py-3 text-sm text-crema placeholder-crema/20 focus:outline-none focus:border-gold transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="w-full bg-gold text-olive hover:bg-gold-bright hover:scale-102 transition-all duration-300 py-3.5 rounded-md text-xs font-semibold tracking-widest uppercase shadow-lg text-center"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Go back boutique option */}
          <div className="text-center pt-2 border-t border-gold/10">
            <Link
              href="/"
              className="text-[10px] tracking-wider text-crema/40 hover:text-gold uppercase transition-colors"
            >
              &larr; Volver a la Boutique de Clientes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // RENDER SIDEBAR AND CRM WORKSPACE IF AUTHENTICATED
  return (
    <div className="flex h-screen w-screen bg-[#0D140D] text-crema/90 font-sans overflow-hidden dark-theme">
      {/* SIDEBAR */}
      <aside
        className={`bg-[#0A0F0A] border-r border-gold/15 flex flex-col transition-all duration-300 relative z-30 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gold/15">
          <Link
            href="/admin"
            className="flex items-center gap-3 overflow-hidden select-none"
          >
            <div className="w-8 h-8 rounded bg-gold flex items-center justify-center text-olive font-bold text-sm shrink-0 border border-gold/20">
              M8
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="editorial-title text-sm tracking-widest font-semibold text-gold">
                  MAISON VIII
                </span>
                <span className="text-[8px] tracking-[0.2em] text-crema/40 uppercase -mt-0.5">
                  CRM Dashboard
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded bg-[#121A12] border border-gold/10 hover:bg-[#1E2C1E] text-gold/80 hover:text-gold hidden md:block"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gold text-olive shadow-lg font-semibold"
                    : "text-crema/60 hover:bg-[#121A12] hover:text-gold"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive
                      ? "text-olive"
                      : "text-crema/40 group-hover:text-gold"
                  }`}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Go back to client boutique and Logout row */}
        <div className="p-4 border-t border-gold/15 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-4 px-4 py-2.5 text-[10px] tracking-wider font-semibold text-crema/50 hover:text-gold hover:bg-[#121A12] rounded transition-all duration-200 uppercase"
          >
            <Home className="w-4 h-4 shrink-0 text-crema/45" />
            {!collapsed && <span>Boutique Clientes</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-2.5 text-[10px] tracking-wider font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded transition-all duration-200 uppercase"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500/70" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-20 border-b border-gold/15 bg-[#0A0F0A] flex items-center justify-between px-8 shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            <h2 className="editorial-title text-xl text-gold font-light tracking-wide">
              {pathname === "/admin" && "Resumen de Negocios"}
              {pathname === "/admin/pos" && "Punto de Venta"}
              {pathname === "/admin/pedidos" && "Panel de Pedidos"}
              {pathname === "/admin/productos" && "Administración de Catálogo"}
              {pathname === "/admin/clientes" && "Directorio de Clientes"}
              {pathname === "/admin/club" && "LE CLUB 8: Programa de Fidelización"}
              {pathname === "/admin/configuracion" &&
                "Configuraciones Avanzadas"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="p-2.5 rounded-full bg-[#121A12] border border-gold/10 text-gold/80 hover:text-gold hover:bg-[#1E2C1E] transition-all relative"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-olive">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {showNotifPanel && (
                <div className="absolute right-0 mt-3 w-80 rounded-lg bg-[#0E150E] border border-gold/25 p-4 shadow-2xl z-50 text-xs">
                  <div className="flex justify-between items-center border-b border-gold/15 pb-2 mb-3">
                    <span className="font-semibold text-gold tracking-wide uppercase text-[10px]">
                      Notificaciones CRM
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-gold/60 hover:text-gold font-medium"
                      >
                        Marcar todo leido
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-crema/40 text-center py-6">
                        Sin notificaciones pendientes.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded border transition-colors ${
                            n.read
                              ? "bg-[#121A12]/40 border-gold/5 text-crema/50"
                              : "bg-[#1E2C1E]/30 border-gold/20 text-crema"
                          }`}
                        >
                          <p className="leading-relaxed font-light">
                            {n.message}
                          </p>
                          <span className="text-[8px] text-crema/30 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1E2C1E] border border-gold flex items-center justify-center font-bold text-xs text-gold">
                {currentUser ? currentUser.substring(0, 2).toUpperCase() : "AD"}
              </div>
              <span className="text-xs font-semibold tracking-wide text-crema/70 hidden sm:inline">
                {currentUser || "Administrador"}
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[#0D140D] p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
