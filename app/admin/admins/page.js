'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    api.get('/admin/admins')
      .then((r) => setAdmins(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });
    try {
      const { data } = await api.post('/admin/admins', form);
      setAdmins((prev) => [data.user, ...prev.filter((a) => a._id !== data.user._id)]);
      setForm({ name: '', phone: '' });
      setShowForm(false);
      setMsg({ text: 'Sub-admin added successfully', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to add admin', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this admin? They will become a regular customer.')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      setAdmins((prev) => prev.filter((a) => a._id !== id));
      setMsg({ text: 'Admin removed', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to remove admin', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Only you (super admin) can manage admins</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowForm(!showForm); setMsg({ text: '', type: '' }); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Sub-Admin'}
        </motion.button>
      </div>

      {/* Feedback message */}
      <AnimatePresence>
        {msg.text && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
              msg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}
          >
            {msg.type === 'success' ? '✅' : '❌'} {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="overflow-hidden mb-6"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-5 flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">New Sub-Admin</p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-400">
                <p className="font-semibold mb-1">⚠️ Sub-admin restrictions:</p>
                <ul className="list-disc list-inside flex flex-col gap-0.5">
                  <li>Can approve / reject workers</li>
                  <li>Can approve worker payouts</li>
                  <li>Can view users, reviews, payments</li>
                  <li className="text-red-500 dark:text-red-400">Cannot add or remove admins</li>
                  <li className="text-red-500 dark:text-red-400">Cannot deactivate users</li>
                  <li className="text-red-500 dark:text-red-400">Cannot delete reviews</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Jean Pierre"
                    required
                    className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="0781234567"
                    required
                    className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add Sub-Admin'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Admins list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No admins found</div>
      ) : (
        <div className="flex flex-col gap-3">
          {admins.map((admin, i) => (
            <motion.div
              key={admin._id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {admin.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{admin.name}</p>
                  {admin.isSuperAdmin ? (
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                      👑 Super Admin
                    </span>
                  ) : (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full">
                      Sub-Admin
                    </span>
                  )}
                  {admin._id === user?._id && (
                    <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">You</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{admin.phone}</p>
              </div>
              {!admin.isSuperAdmin && admin._id !== user?._id && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRemove(admin._id)}
                  className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                >
                  Remove
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
