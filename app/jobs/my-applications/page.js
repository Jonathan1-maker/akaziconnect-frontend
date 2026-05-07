'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/LangContext';

const STATUS_COLORS = {
  pending:  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  reviewed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  accepted: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};
const STATUS_ICONS = { pending: '⏳', reviewed: '👀', accepted: '✅', rejected: '❌' };

export default function MyApplicationsPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    api.get('/applications/my').then((r) => setApplications(r.data)).catch(() => {}).finally(() => setFetching(false));
  }, [loading, user]);

  if (loading || fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('applications.myTitle')}</h1>
        <Link href="/jobs" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('applications.browseJobs')}</Link>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('applications.noMyApplications')}</p>
          <Link href="/jobs" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {t('applications.findJobs')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app, i) => (
            <motion.div key={app._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl flex-shrink-0">{app.job?.category?.icon || '💼'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{app.job?.title}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{app.job?.companyName}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">📍 {app.job?.location}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[app.status]}`}>
                  {STATUS_ICONS[app.status]} {t(`applications.status${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`)}
                </span>
              </div>
              {app.companyNote && (
                <div className="mt-3 bg-gray-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-600 dark:text-gray-300">📝 {t('applications.companyNote')}: {app.companyNote}</p>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700">
                <Link href={`/jobs/${app.job?._id}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">{t('applications.viewJob')}</Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
