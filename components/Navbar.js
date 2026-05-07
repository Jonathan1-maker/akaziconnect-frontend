'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { useNotifications } from '@/lib/NotificationContext';
import { useT, useLang, LANGUAGES } from '@/lib/LangContext';
import { 
  BellIcon, 
  SunIcon, 
  MoonIcon, 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

function LangSwitcher() {
  const { lang, switchLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-semibold"
      >
        <span>{current.flag}</span>
        <span className="text-gray-700 dark:text-gray-200 text-xs">{current.code.toUpperCase()}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { switchLang(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                lang === l.code
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const t = useT();
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        aria-label={t('nav.notifications')}
      >
        <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <p className="font-semibold text-sm text-gray-800 dark:text-white">{t('nav.notifications')}</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  {t('nav.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <BellIcon className="w-10 h-10 mx-auto text-gray-200 dark:text-slate-700 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('nav.noNotifications')}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && markRead(n._id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors ${
                      !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                        {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(n._id); }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNotifications({ t, onClose }) {
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-50 dark:border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 text-gray-600 dark:text-gray-300"
      >
        <span className="flex items-center gap-2">
          🔔 {t('nav.notifications')}
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mb-2 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="w-full text-xs text-blue-600 dark:text-blue-400 py-2 px-3 text-right hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700">
              {t('nav.markAllRead')}
            </button>
          )}
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">{t('nav.noNotifications')}</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n._id} onClick={() => { !n.read && markRead(n._id); }}
                  className={`flex items-start gap-2 px-3 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0 cursor-pointer ${
                    !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.read ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove(n._id); }}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-xs flex-shrink-0 ml-1">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const t = useT();

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
          Akazi<span className="text-gray-800 dark:text-white">Connect</span>
        </Link>

        <div className="hidden md:flex gap-6 items-center text-sm font-medium">
          <Link href="/workers" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {t('nav.findWorkers')}
          </Link>
          <Link href="/jobs" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {t('nav.jobs')}
          </Link>
          {user && (
            <Link href="/chat" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.messages')}
            </Link>
          )}
          {user?.role === 'worker' && (
            <Link href="/earnings" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.earnings')}
            </Link>
          )}
          {user?.role === 'worker' && (
            <Link href="/bookings/worker" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.bookings')}
            </Link>
          )}
          {user?.role === 'worker' && (
            <Link href="/profile" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.myProfile')}
            </Link>
          )}
          {user?.role === 'worker' && (
            <Link href="/jobs/my-applications" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.myApplications')}
            </Link>
          )}
          {user?.role === 'company' && (
            <Link href="/jobs/my" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.myJobs')}
            </Link>
          )}
          {user?.role === 'company' && (
            <Link href="/jobs/post" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.postJob')}
            </Link>
          )}
          {user?.role === 'customer' && (
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('nav.myDashboard')}
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link href="/admin" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold transition-colors">
              {t('nav.admin')}
            </Link>
          )}
          {user ? (
            <>
              <NotificationBell />
              <button onClick={logout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5 inline-block mr-1" />
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t('nav.login')}
              </Link>
              <Link href="/register" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Register
              </Link>
              <Link href="/register-worker" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors">
                {t('nav.joinAsWorker')}
              </Link>
              <Link href="/register-company" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors">
                Post Jobs
              </Link>
            </>
          )}
          <LangSwitcher />
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <LangSwitcher />
          <button onClick={toggle} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-base">
            {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300"
          >
            {open ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700"
          >
            <div className="px-4 py-4 flex flex-col gap-1 text-sm font-medium">
              <Link href="/workers" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.findWorkers')}</Link>
              <Link href="/jobs" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.jobs')}</Link>
              {user && <Link href="/chat" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.messages')}</Link>}
              {user && <MobileNotifications t={t} onClose={() => setOpen(false)} />}
              {user?.role === 'worker' && <Link href="/bookings/worker" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.bookings')}</Link>}
              {user?.role === 'worker' && <Link href="/earnings" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.earnings')}</Link>}
              {user?.role === 'worker' && <Link href="/profile" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.myProfile')}</Link>}
              {user?.role === 'worker' && <Link href="/jobs/my-applications" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.myApplications')}</Link>}
              {user?.role === 'company' && <Link href="/jobs/my" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.myJobs')}</Link>}
              {user?.role === 'company' && <Link href="/jobs/post" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.postJob')}</Link>}
              {user?.role === 'customer' && <Link href="/dashboard" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.myDashboard')}</Link>}
              {user?.role === 'admin' && <Link href="/admin" onClick={() => setOpen(false)} className="text-purple-600 dark:text-purple-400 font-semibold py-2.5 border-b border-gray-50 dark:border-slate-700">{t('nav.admin')}</Link>}
              {user ? (
                <button onClick={() => { logout(); setOpen(false); }} className="text-red-500 text-left py-2.5 mt-1">{t('nav.logout')}</button>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link href="/login" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2">{t('nav.login')}</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="text-gray-600 dark:text-gray-300 py-2">Register</Link>
                  <Link href="/register-worker" onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-center transition-colors">{t('nav.joinAsWorker')}</Link>
                  <Link href="/register-company" onClick={() => setOpen(false)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-center transition-colors">{t('nav.postJobsCompany')}</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
