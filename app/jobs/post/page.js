'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useT } from '@/lib/LangContext';

const TYPES = ['full-time', 'part-time', 'contract', 'temporary'];

function PostJobContent() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, loading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ companyName: '', title: '', category: '', location: '', type: 'full-time', description: '', requirements: '', salary: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    if (editId) {
      api.get(`/jobs/${editId}`).then((r) => {
        const j = r.data;
        setForm({ companyName: j.companyName, title: j.title, category: j.category?._id || '', location: j.location, type: j.type, description: j.description, requirements: j.requirements || '', salary: j.salary || '', deadline: j.deadline ? j.deadline.slice(0, 10) : '' });
      }).catch(() => {});
    }
  }, [editId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId) await api.put(`/jobs/${editId}`, form);
      else await api.post('/jobs', form);
      router.push('/jobs/my');
    } catch (err) { setError(err.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const TYPE_LABELS = { 'full-time': t('jobs.typeFullTime'), 'part-time': t('jobs.typePartTime'), contract: t('jobs.typeContract'), temporary: t('jobs.typeTemporary') };

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{editId ? t('jobs.editTitle') : t('jobs.postTitle')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('jobs.postSubtitle')}</p>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 sm:p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.companyName')} *</label>
            <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required placeholder="e.g. Kigali Tech Ltd"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.jobTitle')} *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Senior Plumber"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('register.category')} *</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} required
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors">
              <option value="">{t('register.categoryPlaceholder')}</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.location')} *</label>
            <input value={form.location} onChange={(e) => set('location', e.target.value)} required placeholder="e.g. Kigali, Gasabo"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.jobType')}</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors">
              {TYPES.map((tp) => <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.salaryOptional')}</label>
            <input value={form.salary} onChange={(e) => set('salary', e.target.value)} placeholder="e.g. 150,000 RWF/month"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.deadlineOptional')}</label>
            <input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.descriptionLabel')} * <span className="text-gray-400">({form.description.length}/2000)</span></label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={5} maxLength={2000}
            placeholder="Describe the role, responsibilities…"
            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors resize-none placeholder-gray-400" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('jobs.requirementsLabel')} <span className="text-gray-400">({form.requirements.length}/1000)</span></label>
          <textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} rows={4} maxLength={1000}
            placeholder="List skills, experience, qualifications…"
            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors resize-none placeholder-gray-400" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            {saving ? t('jobs.saving') : editId ? t('jobs.updateJob') : t('jobs.saveJob')}
          </button>
          <button type="button" onClick={() => router.back()} className="sm:w-auto py-3 px-5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center">
            {t('jobs.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PostJobPage() {
  return <Suspense fallback={null}><PostJobContent /></Suspense>;
}
