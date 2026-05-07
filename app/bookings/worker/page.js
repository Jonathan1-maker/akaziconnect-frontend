'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const statusConfig = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', icon: '⏳' },
  accepted:  { label: 'Accepted',  color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',   icon: '✅' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',           icon: '❌' },
  completed: { label: 'Completed', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       icon: '🏁' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400',         icon: '🚫' },
};

export default function WorkerBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'worker') router.push('/');
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'worker') { setFetching(false); return; }
    api.get('/bookings/worker')
      .then((r) => setBookings(r.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [loading, user]);

  const accept = async (id) => {
    await api.put(`/bookings/${id}/accept`);
    setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'accepted' } : b));
  };

  const reject = async () => {
    await api.put(`/bookings/${rejectModal}/reject`, { reason });
    setBookings((prev) => prev.map((b) => b._id === rejectModal ? { ...b, status: 'rejected', rejectionReason: reason } : b));
    setRejectModal(null);
    setReason('');
  };

  const complete = async (id) => {
    await api.put(`/bookings/${id}/complete`);
    setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'completed' } : b));
  };

  const tabs = ['pending', 'accepted', 'completed', 'rejected', 'cancelled'];
  const filtered = bookings.filter((b) => b.status === activeTab);

  if (loading || fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-6">My Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {tabs.map((tab) => {
          const count = bookings.filter((b) => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
              }`}
            >
              {statusConfig[tab].icon} {statusConfig[tab].label}
              {count > 0 && <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${activeTab === tab ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">{statusConfig[activeTab].icon}</div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">No {activeTab} bookings</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {filtered.map((b, i) => (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">
                      {b.customer?.name || b.guestName || 'Guest'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      📞 {b.customer?.phone || b.guestPhone || '—'}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusConfig[b.status].color}`}>
                    {statusConfig[b.status].icon} {statusConfig[b.status].label}
                  </span>
                </div>

                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>📅 {new Date(b.date).toLocaleDateString()}</span>
                  <span>🕐 {b.time}</span>
                </div>

                {b.description && <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">"{b.description}"</p>}
                {b.rejectionReason && <p className="text-xs text-red-400 mb-3">Reason: {b.rejectionReason}</p>}

                {b.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => accept(b._id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                    >✓ Accept</motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setRejectModal(b._id)}
                      className="flex-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 py-2 rounded-xl text-xs font-semibold transition-colors"
                    >✕ Reject</motion.button>
                  </div>
                )}

                {b.status === 'accepted' && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => complete(b._id)}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                  >🏁 Mark as Completed</motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="font-bold text-gray-800 dark:text-white mb-1">Reject Booking</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Optionally tell the customer why</p>
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Not available on that date…" rows={3}
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-red-400 resize-none mb-4 placeholder-gray-400"
              />
              <div className="flex gap-3">
                <button onClick={reject} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Confirm Reject
                </button>
                <button onClick={() => { setRejectModal(null); setReason(''); }} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
