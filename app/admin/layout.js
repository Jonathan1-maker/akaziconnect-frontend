'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useSocket } from '@/lib/SocketContext';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const { socket, reconnect } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, loading]);

  // ensure socket is connected for admin notifications
  useEffect(() => {
    if (user && user.role === 'admin' && !socket) reconnect();
  }, [user, socket]);

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (user.role !== 'admin') return null;

  const navItems = [
    { href: '/admin',          label: 'Overview', icon: '📊' },
    { href: '/admin/workers',  label: 'Workers',  icon: '👷' },
    { href: '/admin/users',    label: 'Users',    icon: '👥' },
    { href: '/admin/reviews',  label: 'Reviews',  icon: '⭐' },
    { href: '/admin/payments', label: 'Payments', icon: '💰' },
    { href: '/admin/bookings', label: 'Bookings', icon: '📅' },
    ...(user.isSuperAdmin ? [{ href: '/admin/admins', label: 'Admins', icon: '👑' }] : []),
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100dvh-64px)]">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex-col py-6 px-3 flex-shrink-0">
        <div className="px-3 mb-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Admin Panel</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            user.isSuperAdmin
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}>
            {user.isSuperAdmin ? '👑 Super Admin' : 'Sub-Admin'}
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top scrollable nav */}
      <div className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 overflow-x-auto flex-shrink-0">
        <div className="flex px-3 py-2 gap-1 min-w-max">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700'
              }`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
