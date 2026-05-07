'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

import { useAuth } from '@/lib/AuthContext';

export default function AdminReviewsPage() {
  const { user: currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFlagged, setShowFlagged] = useState(false);

  useEffect(() => {
    api.get('/admin/reviews')
      .then((r) => setReviews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteReview = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    await api.delete(`/admin/reviews/${id}`);
    setReviews((prev) => prev.filter((r) => r._id !== id));
  };

  const flagReview = async (id, currentFlag) => {
    const reason = currentFlag ? '' : prompt('Reason for flagging (optional):');
    if (!currentFlag && reason === null) return;
    await api.put(`/reviews/${id}/flag`, { reason });
    setReviews((prev) => prev.map((r) => r._id === id ? { ...r, isFlagged: !currentFlag, flagReason: reason || '' } : r));
  };

  const filtered = reviews.filter((r) => {
    const matchSearch =
      r.reviewer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.worker?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!showFlagged || r.isFlagged);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Reviews</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFlagged(!showFlagged)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              showFlagged
                ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            🚩 Flagged {reviews.filter((r) => r.isFlagged).length > 0 && `(${reviews.filter((r) => r.isFlagged).length})`}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">{reviews.length} total</span>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by reviewer, worker or comment…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No reviews found</div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {filtered.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-800 dark:text-white">{review.reviewer?.name || 'Unknown'}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">→</span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">{review.worker?.name || 'Unknown'}</span>
                    <div className="flex text-yellow-400 text-sm ml-auto">
                      {'★'.repeat(review.rating)}
                      <span className="text-gray-200 dark:text-slate-600">{'★'.repeat(5 - review.rating)}</span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{review.comment}</p>
                  )}
                  {review.isFlagged && (
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-1 font-medium">
                      🚩 Flagged{review.flagReason ? `: ${review.flagReason}` : ''}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => flagReview(review._id, review.isFlagged)}
                    title={review.isFlagged ? 'Unflag review' : 'Flag review'}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors text-sm ${
                      review.isFlagged
                        ? 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 text-orange-500'
                        : 'bg-gray-100 dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-400 hover:text-orange-500'
                    }`}
                  >
                    🚩
                  </button>
                  {currentUser?.isSuperAdmin && (
                    <button
                      onClick={() => deleteReview(review._id)}
                      className="w-8 h-8 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 rounded-xl flex items-center justify-center transition-colors text-sm"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
