'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useT } from '@/lib/LangContext';

export default function RegisterWorkerPage() {
  const t = useT();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', category: '', location: '', description: '', yearsOfExperience: '' });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const { data } = await api.post('/auth/register', { name: form.name, phone: form.phone, role: 'worker' });
        localStorage.setItem('token', data.token);
      }

      let categoryId = form.category;

      // if worker typed a custom category, suggest it first to get an ID
      if (useCustomCategory && customCategory.trim()) {
        const { data } = await api.post('/categories/suggest', { name: customCategory.trim() });
        categoryId = data._id;
      }

      if (!categoryId) { setError('Please select or enter a category'); setLoading(false); return; }

      const fd = new FormData();
      Object.entries({ ...form, category: categoryId }).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append('photo', photo);
      await api.post('/workers/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push('/register-worker/success');
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name',              label: t('register.fullName'),    placeholder: t('register.fullNamePlaceholder'),    required: true },
    { name: 'phone',             label: t('register.phone'),       placeholder: t('register.phonePlaceholder'),       required: true },
    { name: 'whatsapp',          label: t('register.whatsapp'),    placeholder: t('register.phonePlaceholder') },
    { name: 'location',          label: t('register.location'),    placeholder: t('register.locationPlaceholder'),    required: true },
    { name: 'yearsOfExperience', label: t('register.experience'),  placeholder: t('register.experiencePlaceholder'),  type: 'number' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('register.title')}</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t('register.subtitle')}</p>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col gap-4">
        {fields.map(({ name, label, placeholder, required, type }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
              type={type || 'text'}
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              required={required}
              className="w-full border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.category')}</label>

          {!useCustomCategory ? (
            <>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required={!useCustomCategory}
                className="w-full border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400"
              >
                <option value="">{t('register.categoryPlaceholder')}</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => { setUseCustomCategory(true); setForm((f) => ({ ...f, category: '' })); }}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                + My category is not listed — type my own
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Gardening, Tailoring, Painting…"
                  required
                  className="flex-1 border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                💡 Your category will be reviewed and approved by admin.
              </p>
              <button
                type="button"
                onClick={() => { setUseCustomCategory(false); setCustomCategory(''); }}
                className="mt-1 text-xs text-gray-500 dark:text-gray-400 hover:underline"
              >
                ← Choose from existing categories
              </button>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.description')}</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={t('register.descriptionPlaceholder')}
            rows={3}
            className="w-full border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.photo')}</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="text-sm text-gray-500 dark:text-gray-400" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('register.loading') : t('register.submitBtn')}
        </button>
      </form>
    </div>
  );
}
