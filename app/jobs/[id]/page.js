'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const TYPE_COLORS = {
  'full-time':  'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'part-time':  'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  contract:     'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  temporary:    'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
};
const TYPE_LABELS = { 'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'Contract', temporary: 'Temporary' };

const STATUS_COLORS = {
  pending:  'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  reviewed: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  accepted: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  rejected: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [job, setJob] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', coverLetter: '' });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ text: '', ok: true });

  useEffect(() => {
    api.get(`/jobs/${id}`).then((r) => setJob(r.data)).catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    api.get(`/applications/${id}/check`)
      .then((r) => { setAlreadyApplied(r.data.applied); setMyApplication(r.data.application); })
      .catch(() => {});
  }, [user, id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg({ text: '', ok: true });
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      if (form.coverLetter) fd.append('coverLetter', form.coverLetter);
      files.forEach((f) => fd.append('documents', f));
      await api.post(`/applications/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAlreadyApplied(true);
      setShowApply(false);
      setSubmitMsg({ text: '✅ Application submitted successfully!', ok: true });
    } catch (err) {
      setSubmitMsg({ text: err.response?.data?.message || 'Failed to submit', ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = user && job && (user._id === (job.company?._id || job.company));

  if (notFound) return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Job not found</p>
      <Link href="/jobs" className="mt-4 inline-block text-blue-600 dark:text-blue-400 text-sm hover:underline">← Back to Jobs</Link>
    </div>
  );

  if (!job) return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse flex flex-col gap-4">
      <div className="h-40 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
      <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  );

  return (
    <motion.div className="max-w-3xl mx-auto px-4 py-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/jobs" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-5 inline-block">← Back to Jobs</Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-3xl flex-shrink-0">
            {job.category?.icon || '💼'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{job.title}</h1>
            <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm mt-0.5">{job.companyName}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>📍 {job.location}</span>
              <span>🗂️ {job.category?.name}</span>
              {job.salary && <span className="text-green-600 dark:text-green-400 font-medium">💵 {job.salary}</span>}
              {job.deadline && <span>⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4">
        <h2 className="font-bold text-gray-800 dark:text-white mb-3">Job Description</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{job.description}</p>
      </div>

      {job.requirements && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4">
          <h2 className="font-bold text-gray-800 dark:text-white mb-3">Requirements</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{job.requirements}</p>
        </div>
      )}

      {/* Apply / Status */}
      {submitMsg.text && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`text-sm font-medium px-4 py-3 rounded-xl mb-4 ${submitMsg.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
          {submitMsg.text}
        </motion.p>
      )}

      {!isOwner && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4">
          {alreadyApplied ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">Your Application</p>
                {myApplication && (
                  <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[myApplication.status]}`}>
                    {myApplication.status.charAt(0).toUpperCase() + myApplication.status.slice(1)}
                  </span>
                )}
                {myApplication?.companyNote && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Note: {myApplication.companyNote}</p>
                )}
              </div>
              <span className="text-2xl">✅</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">Interested in this job?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Submit your application with documents</p>
              </div>
              {user ? (
                <button onClick={() => setShowApply(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
                  Apply Now →
                </button>
              ) : (
                <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Login to Apply
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-white">This is your job posting</p>
          <div className="flex gap-3">
            <Link href={`/jobs/applications/${id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              View Applications
            </Link>
            <Link href={`/jobs/post?edit=${id}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline self-center">
              Edit
            </Link>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      <AnimatePresence>
        {showApply && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowApply(false)}
          >
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-800 dark:text-white">Apply for {job.title}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.companyName}</p>
                </div>
                <button onClick={() => setShowApply(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
              </div>

              <form onSubmit={handleApply} className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name *</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                      placeholder="Your full name"
                      className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone Number *</label>
                    <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required
                      placeholder="+250 7XX XXX XXX"
                      className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cover Letter (optional)</label>
                  <textarea value={form.coverLetter} onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
                    rows={4} maxLength={1000} placeholder="Tell the company why you're a great fit…"
                    className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors resize-none placeholder-gray-400" />
                  <p className="text-xs text-gray-400 text-right mt-0.5">{form.coverLetter.length}/1000</p>
                </div>

                {/* Document upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Documents / Images (optional, max 5)</label>
                  <div onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400">📎 Click to upload CV, certificates, photos</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, PDF, DOC — max 5MB each</p>
                  </div>
                  <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} />
                  {files.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg px-3 py-1.5">
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate">📄 {f.name}</span>
                          <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-500 text-xs ml-2 flex-shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {submitMsg.text && !submitMsg.ok && (
                  <p className="text-sm text-red-500">{submitMsg.text}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                  <button type="button" onClick={() => setShowApply(false)}
                    className="px-4 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
