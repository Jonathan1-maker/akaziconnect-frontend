'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function ContactUnlock({ worker }) {
  const { user } = useAuth();
  const [step, setStep] = useState('locked'); // locked | phone | momo | ussd | processing | waiting | unlocked
  const [guestPhone, setGuestPhone] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // resolve which phone to use
  const customerPhone = user?.phone || guestPhone;

  useEffect(() => {
    const savedPhone = sessionStorage.getItem('guestPhone');
    if (!user && !savedPhone) return;
    if (savedPhone && !user) setGuestPhone(savedPhone);

    const config = user ? {} : { params: { guestPhone: savedPhone } };

    // check if fully unlocked (admin approved)
    api.get(`/payments/access/${worker._id}`, config)
      .then((r) => {
        if (r.data.hasAccess) { setStep('unlocked'); return; }
        // check if paid but waiting for admin
        const waitingKey = `waiting_${worker._id}_${user?._id || savedPhone}`;
        if (sessionStorage.getItem(waitingKey)) setStep('waiting');
      })
      .catch(() => {});
  }, [user, worker._id]);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!guestPhone.trim() || guestPhone.trim().length < 9) {
      setPhoneError('Enter a valid phone number');
      return;
    }
    setPhoneError('');
    sessionStorage.setItem('guestPhone', guestPhone.trim());
    initiate(guestPhone.trim());
  };

  const initiate = async (phone) => {
    setError('');
    setStep('processing');
    try {
      const body = { workerId: worker._id };
      if (!user) body.guestPhone = phone || customerPhone;
      if (momoPhone) body.momoPhone = momoPhone;
      else if (phone) body.momoPhone = phone;

      const { data } = await api.post('/payments/initiate', body);
      setPaymentData(data);
      setStep(data.momoRequested ? 'momo' : 'ussd');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      if (err.response?.data?.hasAccess) setStep('unlocked');
      else setStep(user ? 'locked' : 'phone');
    }
  };

  const confirm = async () => {
    setStep('processing');
    try {
      const body = user ? {} : { guestPhone: customerPhone };
      await api.put(`/payments/confirm/${paymentData.paymentId}`, body);
      // save waiting state so user sees it on reload
      const waitingKey = `waiting_${worker._id}_${user?._id || customerPhone}`;
      sessionStorage.setItem(waitingKey, '1');
      setStep('waiting');
    } catch (err) {
      setError(err.response?.data?.message || 'Confirmation failed');
      setStep('ussd');
    }
  };

  const copyUssd = () => {
    navigator.clipboard.writeText(paymentData.ussdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Unlocked ──────────────────────────────────────────────
  if (step === 'unlocked') return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium mb-1">
        ✅ Contact unlocked
      </div>
      <motion.a href={`tel:${worker.phone}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200 dark:shadow-none"
      >
        📞 Call {worker.phone}
      </motion.a>
      {worker.whatsapp && (
        <motion.a href={`https://wa.me/${worker.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="bg-green-500 hover:bg-green-600 text-white text-center py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          💬 WhatsApp
        </motion.a>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">

      {/* ── Locked ── */}
      {step === 'locked' && (
        <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-2xl p-5 text-center"
        >
          <div className="text-4xl mb-3">🔒</div>
          <p className="font-semibold text-gray-800 dark:text-white mb-1">Contact is locked</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Pay <span className="font-bold text-blue-600 dark:text-blue-400">500 RWF</span> via MTN MoMo to unlock
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-4">
            <span>Admin: 400 RWF</span><span>·</span><span>Worker: 100 RWF</span>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => user ? initiate() : setStep('phone')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Unlock Contact — 500 RWF
          </motion.button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">No account needed</p>
        </motion.div>
      )}

      {/* ── Phone Input ── */}
      {step === 'phone' && (
        <motion.div key="phone" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-5"
        >
          <p className="font-bold text-gray-800 dark:text-white mb-1">Enter your phone number</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Your number will be shared with the worker and admin so they can follow up with you.
          </p>
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-3">
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="e.g. 0781234567"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-blue-400 transition-colors"
              autoFocus
            />
            {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
            <div className="flex gap-3">
              <motion.button type="submit" whileTap={{ scale: 0.97 }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Continue →
              </motion.button>
              <button type="button" onClick={() => setStep('locked')}
                className="px-4 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ── MoMo Push Sent ── */}
      {step === 'momo' && paymentData && (
        <motion.div key="momo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-5"
        >
          <div className="text-4xl mb-3 text-center">📲</div>
          <p className="font-bold text-gray-800 dark:text-white mb-1 text-center">Check your phone!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
            {paymentData.message}
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 mb-4 text-xs text-yellow-700 dark:text-yellow-400 flex flex-col gap-1">
            <p>1. A MoMo payment request was sent to your phone</p>
            <p>2. Open the MTN MoMo notification and approve</p>
            <p>3. Come back and click <span className="font-semibold">"I've Paid"</span> below</p>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-4 px-1">
            <span className="font-mono">Ref: {paymentData.reference}</span>
            <span>500 RWF</span>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={confirm}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
              ✓ I've Paid
            </motion.button>
            <button onClick={() => setStep('ussd')}
              className="px-4 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              Use USSD
            </button>
          </div>
        </motion.div>
      )}

      {/* ── USSD Code ── */}
      {step === 'ussd' && paymentData && (
        <motion.div key="ussd" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-5"
        >
          <p className="font-bold text-gray-800 dark:text-white mb-1">Dial this USSD code</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Open your phone dialer and send <span className="font-semibold text-blue-600 dark:text-blue-400">500 RWF</span> via MTN MoMo
          </p>

          <div className="bg-gray-900 dark:bg-black rounded-xl p-4 mb-4 flex items-center justify-between gap-3 overflow-x-auto">
            <span className="text-green-400 font-mono text-base sm:text-lg font-bold tracking-widest whitespace-nowrap">{paymentData.ussdCode}</span>
            <button onClick={copyUssd}
              className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4 text-xs text-blue-700 dark:text-blue-300 flex flex-col gap-1">
            <p>1. Open your phone dialer</p>
            <p>2. Dial <span className="font-mono font-bold">{paymentData.ussdCode}</span></p>
            <p>3. Follow the MTN MoMo prompts to confirm</p>
            <p>4. Come back and click <span className="font-semibold">"I've Paid"</span> below</p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-4 px-1 flex-wrap gap-1">
            <span className="font-mono">Ref: {paymentData.reference}</span>
            <span>📞 {customerPhone}</span>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={confirm}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              ✓ I've Paid
            </motion.button>
            <button onClick={() => setStep('locked')}
              className="px-4 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Processing ── */}
      {step === 'processing' && (
        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 py-10 text-gray-500 dark:text-gray-400"
        >
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Processing…</span>
        </motion.div>
      )}

      {/* ── Waiting for admin ── */}
      {step === 'waiting' && (
        <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-5 text-center"
        >
          <div className="text-4xl mb-3">⏳</div>
          <p className="font-bold text-gray-800 dark:text-white mb-1">Payment received!</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            The admin is reviewing your payment. Once confirmed, the worker's contact will be unlocked for you.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            This usually takes a few minutes. You can refresh this page to check.
          </p>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
