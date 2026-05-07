'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/LangContext';

export default function MyJobsPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    api.get('/jobs/my').then((r) => setJobs(r.data)).catch(() => {}).finally(() => setFetching(false));
  }, [loading, user]);

  const remove = async (id) => {
    if (!confirm(t('jobs.remove') + '?')) return;
    await api.delete(`/jobs/${id}`);
    setJobs((prev) => prev.filter((j) => j._id !== id));
  };

  if (loading || fetching) return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('jobs.myJobsTitle')}</h1>
        <Link href="/jobs/post" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">{t('jobs.postNewJob')}</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💼</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('jobs.noMyJobs')}</p>
          <Link href="/jobs/post" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">{t('jobs.postFirst')}</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {jobs.map((job, i) => (
              <motion.div key={job._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl flex-shrink-0">{job.category?.icon || '💼'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{job.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📍 {job.location} · 🗂️ {job.category?.name}</p>
                    {job.salary && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">💵 {job.salary}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('jobs.postedOn')} {new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/jobs/applications/${job._id}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">{t('jobs.applications')}</Link>
                    <Link href={`/jobs/post?edit=${job._id}`} className="text-xs text-gray-500 dark:text-gray-400 font-medium hover:underline">{t('jobs.edit')}</Link>
                    <button onClick={() => remove(job._id)} className="text-xs text-red-500 hover:text-red-600 font-medium">{t('jobs.remove')}</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
