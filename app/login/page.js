'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useSocket } from '@/lib/SocketContext';
import { useT } from '@/lib/LangContext';

export default function LoginPage() {
  const t = useT();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { reconnect } = useSocket();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { phone });
      login(data, data.token);
      reconnect();
      if (data.role === 'admin') router.push('/admin');
      else if (data.role === 'worker') router.push('/bookings/worker');
      else router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('login.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.phoneLabel')}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('login.phonePlaceholder')}
              required
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? t('login.loading') : t('login.submitBtn')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t('login.newUser')}{' '}
          <a href="/register-worker" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">{t('login.registerLink')}</a>
        </p>
      </motion.div>
    </div>
  );
}
