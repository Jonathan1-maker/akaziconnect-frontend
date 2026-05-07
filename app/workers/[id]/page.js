'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import StarRating from '@/components/StarRating';
import ContactUnlock from '@/components/ContactUnlock';
import BookingForm from '@/components/BookingForm';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function WorkerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    api.get(`/workers/${id}`).then((r) => setWorker(r.data)).catch(() => setNotFound(true));
    api.get(`/reviews/${id}`).then((r) => setReviews(r.data)).catch(() => {});
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating) return setReviewMsg('Please select a rating');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/reviews/${id}`, { rating, comment });
      setReviews((prev) => [{ ...data, reviewer: { name: 'You' } }, ...prev]);
      setRating(0);
      setComment('');
      setReviewMsg('Review submitted!');
      setWorker((w) => ({ ...w, totalReviews: w.totalReviews + 1 }));
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Worker not found</p>
    </div>
  );

  if (!worker) return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex gap-6 mb-6">
        <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-3 pt-2">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-lg w-1/2" />
          <div className="h-4 bg-gray-100 dark:bg-slate-600 rounded-lg w-1/3" />
          <div className="h-4 bg-gray-100 dark:bg-slate-600 rounded-lg w-2/3" />
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Profile Header */}
      <motion.div variants={fadeUp} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 mb-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 overflow-hidden flex-shrink-0 mx-auto sm:mx-0 relative">
          {worker.photo && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${API}${worker.photo}`}
              alt={worker.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {worker.category?.icon || '👤'}
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 flex-wrap">
            {worker.name}
            {worker.isVerified && (
              <span title="Verified Worker" className="inline-flex items-center gap-1 text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                ✔️ Verified
              </span>
            )}
          </h1>
          <span className="inline-block text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-xl mt-1">
            {worker.category?.icon} {worker.category?.name}
          </span>
          <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start text-sm text-gray-500 dark:text-gray-400">
            <span>📍 {worker.location}</span>
            {worker.yearsOfExperience > 0 && <span>🏅 {worker.yearsOfExperience} yr{worker.yearsOfExperience > 1 ? 's' : ''} exp</span>}
          </div>
          <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
            <StarRating value={Math.round(worker.averageRating)} readOnly />
            <span className="text-sm text-gray-400 dark:text-gray-500">({worker.totalReviews} reviews)</span>
          </div>
          {worker.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 leading-relaxed">{worker.description}</p>
          )}
        </div>
      </motion.div>

      {/* Contact Unlock */}
      <motion.div variants={fadeUp} className="mb-6">
        <ContactUnlock worker={worker} />
      </motion.div>

      {/* Message Button */}
      <motion.div variants={fadeUp} className="mb-6">
        <motion.button
          onClick={() => router.push(`/chat/${worker.user?._id || worker.user}`)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-center py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          ✉️ Send Message
        </motion.button>
      </motion.div>

      {/* Booking */}
      <motion.div variants={fadeUp} className="mb-6">
        <BookingForm worker={worker} />
      </motion.div>

      {/* Reviews */}
      <motion.div variants={fadeUp} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5">Reviews</h2>

        <form onSubmit={submitReview} className="mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Leave a review</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={3}
            className="w-full mt-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-none transition-colors placeholder-gray-400"
          />
          {reviewMsg && (
            <p className={`text-sm mt-2 ${reviewMsg.includes('!') ? 'text-green-500' : 'text-red-500'}`}>{reviewMsg}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-gray-50 dark:border-slate-700 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{r.reviewer?.name || 'Anonymous'}</span>
                  <StarRating value={r.rating} readOnly />
                </div>
                {r.comment && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{r.comment}</p>}
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
