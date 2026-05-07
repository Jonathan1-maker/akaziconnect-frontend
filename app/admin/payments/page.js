'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

export default function AdminPaymentsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/payments/all')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approvePayout = async (paymentId) => {
    await api.put(`/payments/payout/${paymentId}`);
    setData((prev) => ({
      ...prev,
      pendingPayouts: prev.pendingPayouts - 1,
      payments: prev.payments.map((p) => p._id === paymentId ? { ...p, workerPaid: true } : p),
    }));
  };

  const filtered = (data?.payments || []).filter((p) => {
    const matchSearch =
      p.payer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.worker?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'pending_payout' ? p.status === 'completed' && !p.workerPaid :
      filter === 'completed' ? p.workerPaid : true;
    return matchSearch && matchFilter;
  });

  const statusColor = (p) => {
    if (p.status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    if (p.status === 'completed' && !p.workerPaid) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    if (p.status === 'completed' && p.workerPaid) return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  };

  const statusLabel = (p) => {
    if (p.status === 'pending') return 'Pending';
    if (p.status === 'completed' && !p.workerPaid) return 'Payout Pending';
    if (p.status === 'completed' && p.workerPaid) return 'Paid Out';
    return 'Failed';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Payments</h1>
          {data?.pendingPayouts > 0 && (
            <p className="text-xs text-orange-500 font-medium mt-0.5">
              ⚠️ {data.pendingPayouts} worker payout{data.pendingPayouts > 1 ? 's' : ''} pending
            </p>
          )}
        </div>
        {data && (
          <div className="text-right">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{data.totalRevenue.toLocaleString()} RWF</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Admin Revenue</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by payer, worker or reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400"
        />
        <div className="flex gap-2 flex-wrap">
          {[['all', 'All'], ['pending_payout', '⏳ Payout Pending'], ['completed', '✅ Paid Out']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                filter === val
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No payments found</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Reference</th>
                    <th className="text-left px-5 py-3">Payer</th>
                    <th className="text-left px-5 py-3">Worker</th>
                    <th className="text-left px-5 py-3">Split</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((p, i) => (
                      <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{p.reference}</td>
                        <td className="px-5 py-3">
                          <p className="text-gray-800 dark:text-white font-medium">{p.customerName}</p>
                          <p className="text-xs text-gray-400">{p.customerPhone}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-gray-700 dark:text-gray-300">{p.worker?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{p.worker?.user?.phone}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Admin: <span className="font-semibold text-gray-700 dark:text-gray-200">{p.adminShare} RWF</span></p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Worker: <span className="font-semibold text-gray-700 dark:text-gray-200">{p.workerShare} RWF</span></p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(p)}`}>{statusLabel(p)}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          {p.status === 'completed' && !p.workerPaid && (
                            <button onClick={() => approvePayout(p._id)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                              ✓ Approve
                            </button>
                          )}
                          {p.workerPaid && <span className="text-xs text-green-500 font-medium">✓ Sent</span>}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{p.customerName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{p.customerPhone}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor(p)}`}>{statusLabel(p)}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>Worker: <span className="font-medium text-gray-700 dark:text-gray-300">{p.worker?.name || '—'}</span></span>
                  <span>Admin: <span className="font-medium">{p.adminShare} RWF</span></span>
                  <span>Worker: <span className="font-medium">{p.workerShare} RWF</span></span>
                  <span className="font-mono">{p.reference}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                {p.status === 'completed' && !p.workerPaid && (
                  <button onClick={() => approvePayout(p._id)} className="w-full text-xs bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-semibold transition-colors">
                    ✓ Approve Payout
                  </button>
                )}
                {p.workerPaid && <p className="text-xs text-green-500 font-medium text-center">✓ Payout Sent</p>}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
