'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { useT } from '@/lib/LangContext';

const TYPE_KEYS = ['full-time', 'part-time', 'contract', 'temporary'];
const TYPE_COLORS = {
  'full-time': 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'part-time': 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  contract:    'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  temporary:   'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
};

function JobsContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [locationInput, setLocationInput] = useState(searchParams.get('location') || '');

  const search   = searchParams.get('search') || '';
  const location = searchParams.get('location') || '';
  const category = searchParams.get('category') || '';
  const type     = searchParams.get('type') || '';
  const page     = Number(searchParams.get('page') || 1);

  const TYPE_LABELS = {
    'full-time': t('jobs.typeFullTime'), 'part-time': t('jobs.typePartTime'),
    contract: t('jobs.typeContract'), temporary: t('jobs.typeTemporary'),
  };

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    if (location) params.location = location;
    if (category) params.category = category;
    if (type) params.type = type;
    api.get('/jobs', { params })
      .then((r) => { setJobs(r.data.jobs); setTotal(r.data.total); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [search, location, category, type, page]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    router.push(`/jobs?${p.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams.toString());
    if (searchInput) p.set('search', searchInput); else p.delete('search');
    if (locationInput) p.set('location', locationInput); else p.delete('location');
    p.delete('page');
    router.push(`/jobs?${p.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{t('jobs.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('jobs.subtitle')}</p>
        </div>
        <Link href="/jobs/post" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors self-start sm:self-auto whitespace-nowrap">
          {t('jobs.postBtn')}
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 mb-5">
        <input type="text" placeholder={t('jobs.searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
        <div className="flex gap-2">
          <input type="text" placeholder={t('jobs.locationPlaceholder')} value={locationInput} onChange={(e) => setLocationInput(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">{t('jobs.searchBtn')}</button>
        </div>
      </form>

      <div className="overflow-x-auto pb-2 mb-5">
        <div className="flex gap-2 min-w-max">
          <button onClick={() => setParam('category', '')} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${!category ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'}`}>{t('jobs.allCategories')}</button>
          {categories.map((c) => (
            <button key={c._id} onClick={() => setParam('category', c.slug)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${category === c.slug ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'}`}>
              {c.icon} {c.name}
            </button>
          ))}
          <div className="w-px bg-gray-200 dark:bg-slate-700 mx-1" />
          {TYPE_KEYS.map((val) => (
            <button key={val} onClick={() => setParam('type', type === val ? '' : val)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${type === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'}`}>
              {TYPE_LABELS[val]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {loading ? t('jobs.searching') : `${total} ${total !== 1 ? t('jobs.foundPlural') : t('jobs.found')}`}
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💼</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('jobs.noJobs')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('jobs.noJobsHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job, i) => (
            <motion.div key={job._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl flex-shrink-0">{job.category?.icon || '💼'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-gray-800 dark:text-white text-sm leading-tight">{job.title}</h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{job.companyName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">📍 {job.location}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">🗂️ {job.category?.name}</span>
                    {job.salary && <span className="text-xs text-green-600 dark:text-green-400 font-medium">💵 {job.salary}</span>}
                    {job.deadline && <span className="text-xs text-gray-400 dark:text-gray-500">⏰ {new Date(job.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">{job.description}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-slate-700">
                <span className="text-xs text-gray-400 dark:text-gray-500">{t('jobs.postedOn')} {new Date(job.createdAt).toLocaleDateString()}</span>
                <Link href={`/jobs/${job._id}`} className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors">{t('jobs.viewDetails')}</Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}</div>}>
      <JobsContent />
    </Suspense>
  );
}
