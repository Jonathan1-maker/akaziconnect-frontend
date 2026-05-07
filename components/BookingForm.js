'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export default function BookingForm({ worker }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('form'); // form | ussd | processing | success
  const [form, setForm] = useState({ date: '', time: '', description: '' });
  const [feeData, setFeeData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const reset = () => {
    setOpen(false);
    setStep('form');
    setForm({ date: '', time: '', description: '' });
    setFeeData(null);
    setError('');
  };

  // step 1 — initiate fee, show USSD
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/bookings/fee/initiate', { workerId: worker._id });
      setFeeData(data);
      setStep('ussd');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  // step 2 — confirm payment and create booking
  const handleConfirmPayment = async () => {
    setError('');
    setStep('processing');
    try {
      await api.post('/bookings', {
        workerId: worker._id,
        date: form.date,
        time: form.time,
        description: form.description,
        bookingFeeReference: feeData.reference,
      });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
      setStep('ussd');
    }
  };

  const copyUssd = () => {
    navigator.clipboard.writeText(feeData.ussdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => { if (!user) { router.push('/login'); return; } setOpen(true); }}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        📅 Book this Worker
      </motion.button>
      {!user && <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">Login required to book</p>}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && reset()}
          >
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <AnimatePresence mode="wait">

                {/* Form step */}
                {step === 'form' && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Book {worker.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{worker.category?.icon} {worker.category?.name} · 📍 {worker.location}</p>
                      </div>
                      <button onClick={reset} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-3 mb-4 text-xs text-indigo-700 dark:text-indigo-300">
                      💳 A booking fee of <span className="font-bold">1,000 RWF</span> is required via MTN MoMo
                    </div>

                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <input type="date" value={form.date} min={today}
                          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
                        <div className="grid grid-cols-4 gap-2">
                          {timeSlots.map((t) => (
                            <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, time: t }))}
                              className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                                form.time === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-300'
                              }`}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description (optional)</label>
                        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Describe what you need done…" rows={2}
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 resize-none transition-colors placeholder-gray-400"
                        />
                      </div>
                      {error && <p className="text-red-500 text-sm">{error}</p>}
                      <button type="submit" disabled={loading || !form.date || !form.time}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Loading…' : 'Continue to Payment →'}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* USSD step */}
                {step === 'ussd' && feeData && (
                  <motion.div key="ussd" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">Pay Booking Fee</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Dial the code below to send <span className="font-bold text-indigo-600 dark:text-indigo-400">1,000 RWF</span> via MTN MoMo
                    </p>

                    <div className="bg-gray-900 dark:bg-black rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
                      <span className="text-green-400 font-mono text-lg font-bold tracking-widest">{feeData.ussdCode}</span>
                      <button onClick={copyUssd} className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4 text-xs text-blue-700 dark:text-blue-300 flex flex-col gap-1">
                      <p>1. Open your phone dialer</p>
                      <p>2. Dial <span className="font-mono font-bold">{feeData.ussdCode}</span></p>
                      <p>3. Confirm 1,000 RWF payment on MTN MoMo</p>
                      <p>4. Come back and click <span className="font-semibold">"I've Paid"</span></p>
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex justify-between px-1">
                      <span>Ref: <span className="font-mono">{feeData.reference}</span></span>
                      <span>To: {feeData.adminMomo}</span>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                    <div className="flex gap-3">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirmPayment}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                      >✓ I've Paid — Send Booking</motion.button>
                      <button onClick={() => setStep('form')} className="px-4 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        Back
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Processing */}
                {step === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-3 py-12"
                  >
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Sending booking…</span>
                  </motion.div>
                )}

                {/* Success */}
                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Booking Sent!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Your request has been sent to <span className="font-semibold">{worker.name}</span>. They will accept or reject it shortly.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => router.push('/dashboard')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      >View My Bookings</button>
                      <button onClick={reset} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
