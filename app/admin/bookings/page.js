'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const statusConfig = {
  awaiting_approval: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', label: '💳 Awaiting Fee Approval' },
  pending:   { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', label: '⏳ Pending' },
  accepted:  { color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',   label: '✅ Accepted' },
  rejected:  { color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',           label: '❌ Rejected' },
  completed: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       label: '🏁 Completed' },
  cancelled: { color: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400',         label: '🚫 Cancelled' },
};

export default function AdminBookingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/bookings/all')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approveFee = async (id) => {
    await api.put(`/bookings/${id}/approve-fee`);
    setData((prev) => ({
      ...prev,
      stats: { ...prev.stats, awaiting_approval: prev.stats.awaiting_approval - 1, pending: prev.stats.pending + 1 },
      bookings: prev.bookings.map((b) => b._id === id ? { ...b, status: 'pending', bookingFeePaid: true } : b),
    }));
  };

  const rejectFee = async (id) => {
    await api.put(`/bookings/${id}/reject-fee`);
    setData((prev) => ({
      ...prev,
      stats: { ...prev.stats, awaiting_approval: prev.stats.awaiting_approval - 1 },
      bookings: prev.bookings.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b),
    }));
  };

  const filtered = (data?.bookings || []).filter((b) => {
    const matchSearch =
      b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.phone?.includes(search) ||
      b.worker?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingFeeReference?.toLowerCase().includes(search.toLowerCase());

    const matchFilter = filter === 'all' ? true : b.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = data?.stats;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Bookings</h1>
          {stats?.awaiting_approval > 0 && (
            <p className="text-xs text-orange-500 font-medium mt-0.5">
              ⚠️ {stats.awaiting_approval} booking fee{stats.awaiting_approval > 1 ? 's' : ''} awaiting approval
            </p>
          )}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{data?.bookings?.length || 0} total</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          {Object.entries(stats).filter(([k]) => k !== 'total').map(([key, val]) => (
            <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`rounded-xl p-2.5 text-center transition-all border-2 ${
                filter === key ? 'border-blue-500' : 'border-transparent'
              } ${statusConfig[key]?.color}`}
            >
              <p className="text-lg font-bold">{val}</p>
              <p className="text-xs capitalize">{key.replace('_', ' ')}</p>
            </button>
          ))}
        </div>
      )}

      <input
        type="text" placeholder="Search by customer, worker or reference…"
        value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No bookings found</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Worker</th>
                  <th className="text-left px-5 py-3">Date & Time</th>
                  <th className="text-left px-5 py-3">Fee Ref</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((b, i) => (
                    <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800 dark:text-white">{b.customer?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{b.customer?.phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-gray-700 dark:text-gray-300">{b.worker?.name}</p>
                        <p className="text-xs text-gray-400">{b.worker?.category?.icon} {b.worker?.category?.name}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300">
                        <p>{new Date(b.date).toLocaleDateString()}</p>
                        <p>{b.time}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {b.bookingFeeReference || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[b.status]?.color}`}>
                          {statusConfig[b.status]?.label || b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {b.status === 'awaiting_approval' && (
                          <div className="flex gap-2">
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => approveFee(b._id)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >✓ Approve</motion.button>
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => rejectFee(b._id)}
                              className="text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                            >✕ Reject</motion.button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
