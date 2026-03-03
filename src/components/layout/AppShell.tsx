"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Zap, Rss, LayoutDashboard, Users, FileText, BarChart3,
  Bell, LogOut, Settings, ChevronDown, Menu, X, Globe, Check
} from "lucide-react";
import toast from "react-hot-toast";
import { LANGUAGE_OPTIONS } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  language: string;
  avatar?: string;
}

interface AppContextType {
  user: User | null;
  language: string;
  setLanguage: (lang: string) => void;
  unreadCount: number;
  refreshNotifications: () => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  language: "en",
  setLanguage: () => {},
  unreadCount: 0,
  refreshNotifications: () => {},
});

export const useApp = () => useContext(AppContext);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguageState] = useState("en");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{
    id: string; title: string; message: string; read: boolean; createdAt: string; postId?: string;
  }[]>([]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setUser(data);
          setLanguageState(data.language || "en");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleLanguageChange(lang: string) {
    setLanguageState(lang);
    setLangMenuOpen(false);
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang }),
      });
      toast.success("Language updated");
    } catch {}
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const navItems = [
    { href: "/feed", icon: Rss, label: "Feed" },
    ...(isAdmin
      ? [
          { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/admin/users", icon: Users, label: "Users" },
          { href: "/admin/posts", icon: FileText, label: "Posts" },
          { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
        ]
      : []),
  ];

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.value === language);

  return (
    <AppContext.Provider
      value={{ user, language, setLanguage: handleLanguageChange, unreadCount, refreshNotifications: fetchNotifications }}
    >
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:z-auto`}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Pulse</span>
            <button
              className="ml-auto lg:hidden text-gray-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className={`w-4.5 h-4.5 ${active ? "text-blue-600" : "text-gray-400"}`} style={{ width: 18, height: 18 }} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin</p>
                <div className="text-xs text-gray-500 px-3 py-1">
                  {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                </div>
              </div>
            )}
          </nav>

          {/* User footer */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-1 flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-3 sticky top-0 z-30">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
              >
                <Globe className="w-4 h-4" />
                <span>{currentLang?.label || "English"}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {language === lang.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      <span className={language === lang.value ? "ml-0" : "ml-5.5"} style={{ marginLeft: language === lang.value ? 0 : 22 }}>
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead(); }}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                            !n.read ? "bg-blue-50/50" : ""
                          }`}
                          onClick={() => {
                            if (n.postId) router.push(`/feed?post=${n.postId}`);
                            setNotifOpen(false);
                          }}
                        >
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

        {/* Click outside language menu */}
        {langMenuOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
        )}
        {notifOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
        )}
      </div>
    </AppContext.Provider>
  );
}
