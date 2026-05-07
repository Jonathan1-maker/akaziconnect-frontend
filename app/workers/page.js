'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import WorkerCard from '@/components/WorkerCard';
import WorkerCardSkeleton from '@/components/WorkerCardSkeleton';
import { useT } from '@/lib/LangContext';

const stagger = { show: { transition: { staggerChildren: 0.07 } } };

function WorkersContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [locationInput, setLocationInput] = useState(searchParams.get('location') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const location = searchParams.get('location') || '';
  const category = searchParams.get('category') || '';
  const rating = searchParams.get('rating') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    if (location) params.location = location;
    if (rating) params.rating = rating;
    if (category) params.category = category;
    api.get('/workers', { params })
      .then((r) => { setWorkers(r.data.workers); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, location, category, rating, page]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`/workers?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput) params.set('search', searchInput); else params.delete('search');
    if (locationInput) params.set('location', locationInput); else params.delete('location');
    params.delete('page');
    router.push(`/workers?${params.toString()}`);
  };

  const activeFiltersCount = [category, rating].filter(Boolean).length;

  const ratingOptions = [
    ['', t('workers.anyRating')],
    ['4', '4★ & above'],
    ['3', '3★ & above'],
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder={t('workers.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder-gray-400"
        />
        <input
          type="text"
          placeholder={t('workers.locationPlaceholder')}
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          className="w-full md:w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder-gray-400"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors">
          {t('workers.searchBtn')}
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
            filtersOpen || activeFiltersCount > 0
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400'
              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          ⚙️ {t('workers.filters')} {activeFiltersCount > 0 && <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
        </button>
      </form>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('workers.category')}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateParam('category', '')} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${!category ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-300'}`}>
                    {t('workers.all')}
                  </button>
                  {categories.map((c) => (
                    <button key={c._id} onClick={() => updateParam('category', c.slug)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${category === c.slug ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-300'}`}>
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:w-48">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('workers.minRating')}</p>
                <div className="flex flex-col gap-2">
                  {ratingOptions.map(([val, label]) => (
                    <button key={val} onClick={() => updateParam('rating', val)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border text-left transition-colors ${rating === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? t('workers.searching') : `${total} ${total !== 1 ? t('workers.foundPlural') : t('workers.found')}`}
        </p>
        {(search || location || category || rating) && (
          <button onClick={() => router.push('/workers')} className="text-xs text-red-500 hover:text-red-600 font-medium">
            {t('workers.clearFilters')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <WorkerCardSkeleton key={i} />)}
        </div>
      ) : workers.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('workers.noWorkers')}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('workers.noWorkersHint')}</p>
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={stagger} initial="hidden" animate="show">
          {workers.map((w) => <WorkerCard key={w._id} worker={w} />)}
        </motion.div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {[...Array(pages)].map((_, i) => (
            <button key={i} onClick={() => updateParam('page', i + 1)} className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-blue-300'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <WorkerCardSkeleton key={i} />)}
      </div>
    }>
      <WorkersContent />
    </Suspense>
  );
}
