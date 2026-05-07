'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/workers')
      .then((r) => setWorkers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approve = async (id) => {
    await api.put(`/workers/${id}/approve`);
    setWorkers((prev) => prev.map((w) => w._id === id ? { ...w, isApproved: true } : w));
  };

  const verify = async (id, current) => {
    await api.put(`/workers/${id}/verify`);
    setWorkers((prev) => prev.map((w) => w._id === id ? { ...w, isVerified: !current } : w));
  };

  const reject = async (id) => {
    await api.put(`/workers/${id}/reject`);
    setWorkers((prev) => prev.map((w) => w._id === id ? { ...w, isActive: false } : w));
  };

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.location.toLowerCase().includes(search.toLowerCase()) ||
    w.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Workers</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{workers.length} total</span>
      </div>

      <input
        type="text"
        placeholder="Search by name, location, category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No workers found</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Worker</th>
                    <th className="text-left px-5 py-3">Category</th>
                    <th className="text-left px-5 py-3">Location</th>
                    <th className="text-left px-5 py-3">Rating</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Verified</th>
                    <th className="text-left px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((worker, i) => (
                    <motion.tr key={worker._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3"><div><p className="font-medium text-gray-800 dark:text-white">{worker.name}</p><p className="text-xs text-gray-400 dark:text-gray-500">{worker.phone}</p></div></td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{worker.category?.icon} {worker.category?.name}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{worker.location}</td>
                      <td className="px-5 py-3"><span className="text-yellow-500">★</span><span className="text-gray-700 dark:text-gray-300 ml-1">{worker.averageRating}</span><span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({worker.totalReviews})</span></td>
                      <td className="px-5 py-3">
                        {!worker.isActive ? <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium px-2.5 py-1 rounded-full">Rejected</span>
                        : worker.isApproved ? <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">Approved</span>
                        : <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">Pending</span>}
                      </td>
                      <td className="px-5 py-3">
                        {worker.isVerified ? <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">✔️ Verified</span> : <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {!worker.isApproved && worker.isActive && <button onClick={() => approve(worker._id)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors">Approve</button>}
                          {worker.isApproved && worker.isActive && <button onClick={() => verify(worker._id, worker.isVerified)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${worker.isVerified ? 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>{worker.isVerified ? 'Unverify' : '✔️ Verify'}</button>}
                          {worker.isActive && <button onClick={() => reject(worker._id)} className="text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg transition-colors">Reject</button>}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((worker, i) => (
              <motion.div key={worker._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-1">
                      {worker.name}
                      {worker.isVerified && <span className="text-blue-500 text-xs">✔️</span>}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{worker.phone}</p>
                  </div>
                  {!worker.isActive ? <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0">Rejected</span>
                  : worker.isApproved ? <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0">Approved</span>
                  : <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0">Pending</span>}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>{worker.category?.icon} {worker.category?.name}</span>
                  <span>📍 {worker.location}</span>
                  <span>⭐ {worker.averageRating} ({worker.totalReviews})</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!worker.isApproved && worker.isActive && <button onClick={() => approve(worker._id)} className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-semibold transition-colors">Approve</button>}
                  {worker.isApproved && worker.isActive && <button onClick={() => verify(worker._id, worker.isVerified)} className={`flex-1 text-xs py-2 rounded-xl font-semibold transition-colors ${worker.isVerified ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300' : 'bg-blue-500 text-white'}`}>{worker.isVerified ? 'Unverify' : '✔️ Verify'}</button>}
                  {worker.isActive && <button onClick={() => reject(worker._id)} className="flex-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-xl font-semibold transition-colors">Reject</button>}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
