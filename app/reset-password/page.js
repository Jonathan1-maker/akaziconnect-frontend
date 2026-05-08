'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { phone });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { phone, code, newPassword: password });
      setSuccess('✅ Password reset successfully! Redirecting to login…');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const steps = ['Phone', 'Verify Code', 'New Password'];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">

        <div className="text-3xl mb-3">🔐</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Reset Password</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {step === 1 ? 'Enter your phone number to receive a reset code' :
           step === 2 ? `Enter the 6-digit code sent to ${phone}` :
           'Set your new password'}
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 transition-colors ${step > i + 1 ? 'bg-green-500' : 'bg-gray-100 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium text-center">{success}</div>
        ) : step === 1 ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 7XX XXX XXX" required
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
              {loading ? 'Sending code…' : 'Send Reset Code →'}
            </button>
          </form>
        ) : step === 2 ? (
          <form onSubmit={(e) => { e.preventDefault(); if (code.length === 6) setStep(3); else setError('Enter the 6-digit code'); }} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">6-Digit Code</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} required
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors text-center text-2xl font-mono tracking-widest" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">Code expires in 10 minutes</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={code.length !== 6}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
              Verify Code →
            </button>
            <button type="button" onClick={() => { setStep(1); setCode(''); setError(''); }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline text-center">← Resend code</button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password" required
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
              {loading ? 'Resetting…' : 'Reset Password ✓'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Remember your password? <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
