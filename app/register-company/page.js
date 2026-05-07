'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/LangContext';

export default function RegisterCompanyPage() {
  const t = useT();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', { name: form.name, phone: form.phone, role: 'company' });
      login(data, data.token);
      router.push('/jobs/post');
    } catch (err) { setError(err.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
        <div className="text-3xl mb-3">🏢</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('registerCompany.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t('registerCompany.subtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('registerCompany.companyName')}</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Kigali Tech Ltd" required
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('registerCompany.phone')}</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+250 7XX XXX XXX" required
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            {loading ? t('registerCompany.loading') : t('registerCompany.submitBtn')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t('registerCompany.haveAccount')} <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">{t('registerCompany.login')}</Link>
        </p>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          {t('registerCompany.lookingForWork')} <Link href="/jobs" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">{t('registerCompany.browseJobs')}</Link>
        </p>
      </motion.div>
    </div>
  );
}
