'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/LangContext';

export default function MyBookingsPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [fetching, setFetching] = useState(true);

  const statusConfig = {
    pending:   { label: t('bookings.statusPending'),   color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', icon: '⏳' },
    accepted:  { label: t('bookings.statusAccepted'),  color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',   icon: '✅' },
    rejected:  { label: t('bookings.statusRejected'),  color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',           icon: '❌' },
    completed: { label: t('bookings.statusCompleted'), color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       icon: '🏁' },
    cancelled: { label: t('bookings.statusCancelled'), color: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400',         icon: '🚫' },
  };

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    api.get('/bookings/my')
      .then((r) => setBookings(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  const cancel = async (id) => {
    if (!confirm(t('bookings.cancel') + '?')) return;
    await api.put(`/bookings/${id}/cancel`);
    setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
  };

  if (loading || fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('bookings.title')}</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('bookings.noBookings')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('bookings.noBookingsHint')}</p>
          <button onClick={() => router.push('/workers')} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {t('bookings.findWorkers')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {bookings.map((b, i) => {
              const s = statusConfig[b.status];
              return (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl flex-shrink-0">
                        {b.worker?.category?.icon || '👷'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{b.worker?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{b.worker?.category?.name} · 📍 {b.worker?.location}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>📅 {new Date(b.date).toLocaleDateString()}</span>
                    <span>🕐 {b.time}</span>
                  </div>

                  {b.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">"{b.description}"</p>}
                  {b.status === 'rejected' && b.rejectionReason && (
                    <p className="text-xs text-red-500 dark:text-red-400 mb-2">{t('bookings.reason')}: {b.rejectionReason}</p>
                  )}

                  {['pending', 'accepted'].includes(b.status) && (
                    <button onClick={() => cancel(b._id)} className="text-xs text-red-500 hover:text-red-600 font-medium mt-1">
                      {t('bookings.cancel')}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
