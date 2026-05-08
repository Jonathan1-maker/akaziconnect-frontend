'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPinIcon, StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function WorkerCard({ worker }) {
  const [imgError, setImgError] = useState(false);

  const photoUrl = worker.photo ? (worker.photo.startsWith('http') ? worker.photo : `${API}${worker.photo}`) : null;
  const showImage = !!photoUrl && !imgError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 overflow-hidden flex-shrink-0 relative">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={worker.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {worker.category?.icon || '👤'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-white truncate flex items-center gap-1.5">
            {worker.name}
            {worker.isVerified && (
              <CheckBadgeIcon title="Verified Worker" className="w-5 h-5 text-primary-500 flex-shrink-0" />
            )}
          </h3>
          <span className="inline-block text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg mt-0.5">
            {worker.category?.icon} {worker.category?.name}
          </span>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
            <MapPinIcon className="w-3 h-3" /> {worker.location}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 text-primary-500">
            {[...Array(5)].map((_, i) => (
              i < Math.round(worker.averageRating) 
                ? <StarIcon key={i} className="w-4 h-4" />
                : <StarOutline key={i} className="w-4 h-4 text-gray-200 dark:text-slate-700" />
            ))}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">({worker.totalReviews})</span>
        </div>
        <Link
          href={`/workers/${worker._id}`}
          className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary-500/10 active:scale-95"
        >
          View Profile
        </Link>
      </div>
    </motion.div>
  );
}
