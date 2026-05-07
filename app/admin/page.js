'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';

const stagger = { show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/workers/pending').then((r) => setPending(r.data)).catch(() => {});
    api.get('/categories/pending').then((r) => setPendingCategories(r.data)).catch(() => {});
  }, []);

  const approve = async (id) => {
    await api.put(`/workers/${id}/approve`);
    setPending((prev) => prev.filter((w) => w._id !== id));
    setStats((s) => s ? { ...s, pendingWorkers: s.pendingWorkers - 1, totalWorkers: s.totalWorkers + 1 } : s);
  };

  const reject = async (id) => {
    await api.put(`/workers/${id}/reject`);
    setPending((prev) => prev.filter((w) => w._id !== id));
    setStats((s) => s ? { ...s, pendingWorkers: s.pendingWorkers - 1 } : s);
  };

  const approveCategory = async (id) => {
    await api.put(`/categories/${id}/approve`);
    setPendingCategories((prev) => prev.filter((c) => c._id !== id));
  };

  const rejectCategory = async (id) => {
    await api.delete(`/categories/${id}/reject`);
    setPendingCategories((prev) => prev.filter((c) => c._id !== id));
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { label: 'Active Workers', value: stats.totalWorkers, icon: '👷', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    { label: 'Pending Approval', value: stats.pendingWorkers, icon: '⏳', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: '⭐', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  ] : [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Overview</h1>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={stagger} initial="hidden" animate="show"
      >
        {stats ? statCards.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </motion.div>
        )) : [...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </motion.div>

      {/* Pending Workers */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800 dark:text-white">Pending Approvals</h2>
          {pending.length > 0 && (
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((worker) => (
              <motion.div
                key={worker._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl flex-shrink-0">
                  {worker.category?.icon || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{worker.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{worker.category?.name} · 📍 {worker.location}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">📞 {worker.phone}</p>
                  {worker.registrationFeeReference && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">💳 Ref: <span className="font-mono">{worker.registrationFeeReference}</span></p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve(worker._id)}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(worker._id)}
                    className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Categories */}
      {pendingCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800 dark:text-white">Suggested Categories</h2>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pendingCategories.length} pending
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {pendingCategories.map((cat) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl flex-shrink-0">
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{cat.name}</p>
                  {cat.suggestedBy && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Suggested by {cat.suggestedBy.name} · {cat.suggestedBy.phone}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveCategory(cat._id)}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectCategory(cat._id)}
                    className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
