'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function WorkerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileRef = useRef(null);

  const [worker, setWorker] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', category: '', location: '', description: '', yearsOfExperience: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'worker') router.push('/');
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'worker') { setFetching(false); return; }
    Promise.all([
      api.get('/workers/me'),
      api.get('/categories'),
    ]).then(([wRes, cRes]) => {
      const w = wRes.data;
      setWorker(w);
      setCategories(cRes.data);
      setForm({
        name: w.name || '',
        phone: w.phone || '',
        whatsapp: w.whatsapp || '',
        category: w.category?._id || '',
        location: w.location || '',
        description: w.description || '',
        yearsOfExperience: w.yearsOfExperience || '',
      });
    }).catch(() => {}).finally(() => setFetching(false));
  }, [loading, user]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', ok: true });
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);
      const { data } = await api.put('/workers/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setWorker(data.worker);
      setPhotoFile(null);
      setMsg({ text: '✅ Profile updated successfully!', ok: true });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update profile', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = photoPreview || (worker?.photo ? (worker.photo.startsWith('http') ? worker.photo : `${API}${worker.photo}`) : null);

  if (loading || fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse flex flex-col gap-4">
      <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
      <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update your worker profile information</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Photo */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 flex flex-col items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-2xl overflow-hidden cursor-pointer group bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0"
          >
            {currentPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentPhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{worker?.category?.icon || '👤'}</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Change</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{worker?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{worker?.category?.icon} {worker?.category?.name}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              {worker?.isVerified && <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">✔️ Verified</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${worker?.isApproved ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                {worker?.isApproved ? '✅ Approved' : '⏳ Pending Approval'}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
            📷 Change profile photo
          </button>
        </div>

        {/* Fields */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 flex flex-col gap-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Personal Information</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name',              label: 'Full Name',           placeholder: 'Jean Pierre' },
              { key: 'phone',             label: 'Phone Number',        placeholder: '+250 7XX XXX XXX' },
              { key: 'whatsapp',          label: 'WhatsApp (optional)', placeholder: '+250 7XX XXX XXX' },
              { key: 'location',          label: 'Location',            placeholder: 'Kigali, Gasabo' },
              { key: 'yearsOfExperience', label: 'Years of Experience', placeholder: '3', type: 'number' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                <input
                  type={type || 'text'}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder-gray-400"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe your skills and experience…"
              rows={3}
              maxLength={500}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors resize-none placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">{form.description.length}/500</p>
          </div>
        </div>

        {msg.text && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium px-4 py-3 rounded-xl ${msg.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}
          >
            {msg.text}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
