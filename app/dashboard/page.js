'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const statusConfig = {
  awaiting_approval: { label: 'Awaiting Approval', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', icon: '💳' },
  pending:   { label: 'Pending',   color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', icon: '⏳' },
  accepted:  { label: 'Accepted',  color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',   icon: '✅' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',           icon: '❌' },
  completed: { label: 'Completed', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',       icon: '🏁' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400',         icon: '🚫' },
};

export default function CustomerDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // redirect if not logged in or not customer
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  const fetchData = useCallback(async () => {
    setFetching(true);
    setError('');
    try {
      const [bookingsRes, chatsRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/chat'),
      ]);
      setBookings(bookingsRes.data);
      setConversations(chatsRes.data);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
      console.error('Dashboard fetch error:', err.response?.data || err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  // fetch once user is confirmed
  useEffect(() => {
    if (!loading && user) fetchData();
  }, [loading, user, fetchData]);

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  // show spinner while auth is loading
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">My Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
            ↻ Refresh
          </button>
          <button onClick={() => { logout(); router.push('/'); }}
            className="text-xs text-red-500 hover:text-red-600 font-medium"
          >Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'bookings', label: '📅 My Bookings', count: bookings.filter((b) => ['pending', 'awaiting_approval'].includes(b.status)).length },
          { key: 'messages', label: '💬 Messages', count: conversations.reduce((s, c) => s + (c.unread || 0), 0) },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${tab === t.key ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4 flex items-center justify-between">
          {error}
          <button onClick={fetchData} className="font-semibold underline ml-2">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {fetching && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!fetching && (
        <AnimatePresence mode="wait">
          {/* Bookings Tab */}
          {tab === 'bookings' && (
            <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {bookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">📅</div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No bookings yet</p>
                  <Link href="/workers" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Find Workers
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bookings.map((b, i) => {
                    const s = statusConfig[b.status] || statusConfig.pending;
                    return (
                      <motion.div key={b._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl">
                              {b.worker?.category?.icon || '👷'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white text-sm">{b.worker?.name || '—'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {b.worker?.category?.name} {b.worker?.location ? `· 📍 ${b.worker.location}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>
                            {s.icon} {s.label}
                          </span>
                        </div>

                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span>📅 {new Date(b.date).toLocaleDateString()}</span>
                          <span>🕐 {b.time}</span>
                        </div>

                        {b.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-2">"{b.description}"</p>
                        )}

                        {b.status === 'awaiting_approval' && (
                          <p className="text-xs text-orange-500 dark:text-orange-400 mb-2">
                            💳 Ref: <span className="font-mono">{b.bookingFeeReference}</span> — Admin is verifying your payment
                          </p>
                        )}

                        {b.status === 'rejected' && b.rejectionReason && (
                          <p className="text-xs text-red-500 mb-2">Reason: {b.rejectionReason}</p>
                        )}

                        <div className="flex gap-3 mt-2 flex-wrap">
                          {['pending', 'accepted', 'awaiting_approval'].includes(b.status) && (
                            <button onClick={() => cancel(b._id)}
                              className="text-xs text-red-500 hover:text-red-600 font-medium"
                            >Cancel</button>
                          )}
                          {b.worker?.user && (
                            <button onClick={() => router.push(`/chat/${b.worker.user._id || b.worker.user}`)}
                              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >💬 Message Worker</button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Messages Tab */}
          {tab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {conversations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Chat with a worker from their profile</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {conversations.map((conv, i) => (
                    <motion.button key={conv.userId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/chat/${conv.userId}`)}
                      className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {conv.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">{conv.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(conv.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                          {conv.unread > 0 && (
                            <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
