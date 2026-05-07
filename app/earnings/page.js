'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/LangContext';

const stagger = { show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function EarningsPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'worker') router.push('/');
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'worker') { setFetching(false); return; }
    api.get('/payments/earnings')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [loading, user]);

  if (loading || fetching) return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse flex flex-col gap-4">
      <div className="h-28 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
      <div className="h-48 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  );

  const stats = data ? [
    { label: t('earnings.totalUnlocks'), value: data.totalUnlocks,                              icon: '🔓', color: 'text-blue-600 dark:text-blue-400' },
    { label: t('earnings.received'),     value: `${data.totalEarnings.toLocaleString()} RWF`,   icon: '✅', color: 'text-green-600 dark:text-green-400' },
    { label: t('earnings.pending'),      value: `${data.pendingEarnings.toLocaleString()} RWF`, icon: '⏳', color: 'text-yellow-600 dark:text-yellow-400' },
    { label: t('earnings.perUnlock'),    value: '100 RWF',                                      icon: '💵', color: 'text-gray-600 dark:text-gray-300' },
  ] : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('earnings.title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('earnings.subtitle')} <span className="font-semibold text-blue-600 dark:text-blue-400">100 RWF</span> {t('earnings.subtitlePer')}
      </p>

      <motion.div className="grid grid-cols-2 gap-4 mb-8" variants={stagger} initial="hidden" animate="show">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            <span className="text-2xl">{s.icon}</span>
            <p className={`text-xl font-bold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="font-bold text-gray-800 dark:text-white mb-5">{t('earnings.history')}</h2>

        {data?.payments?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">{t('earnings.noTransactions')}</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">{t('earnings.noTransactionsHint')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {data?.payments?.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-3.5 border-b border-gray-50 dark:border-slate-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${p.workerPaid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                    {p.workerPaid ? '✅' : '⏳'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{p.customerName || p.payer?.name || t('earnings.guest')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{p.customerPhone || p.payer?.phone || p.guestPhone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${p.workerPaid ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {p.workerPaid ? '+' : '~'}{p.workerShare} RWF
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.workerPaid ? t('earnings.receivedLabel') : t('earnings.pendingLabel')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
