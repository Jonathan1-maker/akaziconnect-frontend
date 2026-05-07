'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users').then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (id) => {
    await api.put(`/admin/users/${id}/toggle`);
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
  );

  const roleBadge = (role) => ({
    admin:    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    worker:   'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    customer: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300',
  }[role] || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300');

  const ActionBtn = ({ user }) => {
    if (user.role === 'admin' || !currentUser?.isSuperAdmin) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
    return (
      <button onClick={() => toggleActive(user._id)}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
          user.isActive
            ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400'
            : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 text-green-600 dark:text-green-400'
        }`}
      >
        {user.isActive ? 'Deactivate' : 'Activate'}
      </button>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Users</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{users.length} total</span>
      </div>

      <input
        type="text" placeholder="Search by name or phone…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors placeholder-gray-400"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">No users found</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Phone</th>
                    <th className="text-left px-5 py-3">Role</th>
                    <th className="text-left px-5 py-3">Joined</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => (
                    <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{user.name}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{user.phone}</td>
                      <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge(user.role)}`}>{user.role}</span></td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3"><ActionBtn user={user} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((user, i) => (
              <motion.div key={user._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleBadge(user.role)}`}>{user.role}</span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  <ActionBtn user={user} />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
