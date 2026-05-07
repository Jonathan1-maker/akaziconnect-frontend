'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  accepted: { label: 'Accepted', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
};

export default function JobApplicationsPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }
    Promise.all([
      api.get(`/applications/${jobId}`),
      api.get(`/jobs/${jobId}`),
    ]).then(([aRes, jRes]) => {
      setApplications(aRes.data);
      setJob(jRes.data);
    }).catch(() => {}).finally(() => setFetching(false));
  }, [loading, user, jobId]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/applications/${id}/status`, { status, companyNote: note });
      setApplications((prev) => prev.map((a) => a._id === id ? { ...a, status: data.application.status, companyNote: data.application.companyNote } : a));
      setSelected(null);
      setNote('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || fetching) return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/jobs/my" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-5 inline-block">← My Jobs</Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Applications</h1>
        {job && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{job.title} · {applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No applications yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Share your job posting to get applicants</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app, i) => (
            <motion.div key={app._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{app.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📞 {app.phone}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_CONFIG[app.status].color}`}>
                  {STATUS_CONFIG[app.status].label}
                </span>
              </div>

              {app.coverLetter && (
                <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded-xl p-3 mb-3 leading-relaxed">
                  "{app.coverLetter}"
                </p>
              )}

              {app.documents?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {app.documents.map((doc, j) => {
                    const isImage = /\.(jpg|jpeg|png)$/i.test(doc);
                    return isImage ? (
                      <a key={j} href={`${API}${doc}`} target="_blank" rel="noreferrer"
                        className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${API}${doc}`} alt="doc" className="w-full h-full object-cover" />
                      </a>
                    ) : (
                      <a key={j} href={`${API}${doc}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        📄 Document {j + 1}
                      </a>
                    );
                  })}
                </div>
              )}

              {app.companyNote && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">📝 Note: {app.companyNote}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50 dark:border-slate-700">
                {['reviewed', 'accepted', 'rejected'].map((s) => (
                  <button key={s} onClick={() => setSelected({ id: app._id, status: s })}
                    disabled={app.status === s}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 ${
                      s === 'accepted' ? 'bg-green-500 hover:bg-green-600 text-white' :
                      s === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400' :
                      'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 text-blue-600 dark:text-blue-400'
                    }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Status update modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="font-bold text-gray-800 dark:text-white mb-1 capitalize">Mark as {selected.status}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Optionally add a note for the applicant</p>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder="e.g. We'll contact you for an interview…"
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 resize-none mb-4 placeholder-gray-400" />
              <div className="flex gap-3">
                <button onClick={() => updateStatus(selected.id, selected.status)} disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {updating ? 'Saving…' : 'Confirm'}
                </button>
                <button onClick={() => { setSelected(null); setNote(''); }}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
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
