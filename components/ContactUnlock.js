'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const PROVIDERS_META = {
  mtn: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/240px-New-mtn-logo.jpg',
    fallbackBg: 'bg-yellow-400',
    fallbackText: 'MTN',
  },
  airtel: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Airtel_logo.svg/240px-Airtel_logo.svg.png',
    fallbackBg: 'bg-red-600',
    fallbackText: 'airtel',
  },
};

function ProviderLogo({ id, label }) {
  const [err, setErr] = useState(false);
  const meta = PROVIDERS_META[id];
  if (err) {
    return (
      <span className={`h-8 px-3 rounded-md flex items-center justify-center text-white text-xs font-black flex-shrink-0 ${meta.fallbackBg}`}>
        {meta.fallbackText}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={meta.logo}
      alt={label}
      onError={() => setErr(true)}
      className="h-8 w-auto object-contain flex-shrink-0 rounded-md"
    />
  );
}

const PROVIDERS = [
  { id: 'mtn',    label: 'MTN MoMo',     prefix: '078' },
  { id: 'airtel', label: 'Airtel Money', prefix: '073' },
];

export default function ContactUnlock({ worker }) {
  const { user } = useAuth();
  const [step, setStep] = useState('locked');
  const [provider, setProvider] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const customerPhone = user?.phone || phone;

  useEffect(() => {
    const savedPhone = sessionStorage.getItem('guestPhone');
    if (!user && !savedPhone) return;
    if (savedPhone && !user) setPhone(savedPhone);
    const config = user ? {} : { params: { guestPhone: savedPhone } };
    api.get(`/payments/access/${worker._id}`, config)
      .then((r) => {
        if (r.data.hasAccess) { setStep('unlocked'); return; }
        const waitingKey = `waiting_${worker._id}_${user?._id || savedPhone}`;
        if (sessionStorage.getItem(waitingKey)) setStep('waiting');
      })
      .catch(() => {});
  }, [user, worker._id]);

  // start polling every 3s after momo push sent
  useEffect(() => {
    if (step !== 'momo' || !paymentData) return;
    pollRef.current = setInterval(async () => {
      try {
        const params = user ? {} : { params: { guestPhone: customerPhone } };
        const { data } = await api.get(`/payments/status/${paymentData.paymentId}`, params);
        if (data.confirmed) {
          clearInterval(pollRef.current);
          const waitingKey = `waiting_${worker._id}_${user?._id || customerPhone}`;
          sessionStorage.removeItem(waitingKey);
          setStep('unlocked');
        }
      } catch {}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [step, paymentData, user, customerPhone, worker._id]);

  const SECOND_DIGITS = { mtn: ['8', '9'], airtel: ['2', '3'] };

  const handlePay = async (e) => {
    e?.preventDefault();
    const p = phone.trim();
    if (!user) {
      if (p.length !== 9) { setPhoneError('Enter a complete 9-digit number'); return; }
      if (!SECOND_DIGITS[provider].includes(p[1])) {
        setPhoneError(provider === 'mtn' ? 'MTN numbers start with 78 or 79' : 'Airtel numbers start with 72 or 73');
        return;
      }
    }
    setPhoneError('');
    if (!user) sessionStorage.setItem('guestPhone', p);
    setError('');
    setStep('processing');
    try {
      const body = { workerId: worker._id, momoPhone: user ? user.phone : p };
      if (!user) body.guestPhone = p;
      const { data } = await api.post('/payments/initiate', body);
      setPaymentData(data);
      setStep('momo');
      // also save waiting state in case user refreshes
      const waitingKey = `waiting_${worker._id}_${user?._id || (user ? user.phone : p)}`;
      sessionStorage.setItem(waitingKey, '1');
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Try again.');
      if (err.response?.data?.hasAccess) setStep('unlocked');
      else setStep('deposit');
    }
  };


  // ── Unlocked ──
  if (step === 'unlocked') return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold mb-1">
        <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
        Contact Unlocked
      </div>
      <motion.a href={`tel:${worker.phone}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
      >
        📞 Call {worker.phone}
      </motion.a>
      {worker.whatsapp && (
        <motion.a href={`https://wa.me/${worker.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="bg-green-500 hover:bg-green-600 text-white text-center py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
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
          className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-600"
        >
          <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base">Unlock Contact</p>
              <p className="text-blue-200 text-xs mt-0.5">One-time payment · Instant access</p>
            </div>
            <div className="text-right">
              <p className="text-white text-2xl font-black">500</p>
              <p className="text-blue-200 text-xs">RWF</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-5 py-4">
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl flex-shrink-0">🔒</div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Contact is locked</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pay 500 RWF via Mobile Money to view</p>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setPhone('7'); setStep('deposit'); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors"
            >
              Pay & Unlock — 500 RWF
            </motion.button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">No account needed</p>
          </div>
        </motion.div>
      )}

      {/* ── Deposit Screen ── */}
      {step === 'deposit' && (
        <motion.div key="deposit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-600"
        >
          <div className="bg-blue-600 px-5 py-4 flex items-center gap-3">
            <button onClick={() => setStep('locked')} className="text-blue-200 hover:text-white transition-colors text-xl leading-none">‹</button>
            <div>
              <p className="text-white font-bold">Mobile Money Payment</p>
              <p className="text-blue-200 text-xs">Secure · Fast · Easy</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 px-5 py-5">
            {/* Amount */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-5 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Amount to Pay</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white">500 <span className="text-lg font-semibold text-gray-400">RWF</span></p>
            </div>

            {/* Provider selector */}
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Select Provider</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProvider(p.id); setPhone('7'); setPhoneError(''); }}
                  className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                    provider === p.id
                      ? p.id === 'mtn'
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}
                >
                  <ProviderLogo id={p.id} label={p.label} />
                  <span className={`text-xs font-semibold leading-tight ${
                    provider === p.id ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>{p.label}</span>
                  {provider === p.id && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Phone — guests only */}
            {!user && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Mobile Money Number</p>
                <div className={`flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border-2 rounded-xl px-4 py-3 transition-colors ${
                  phoneError ? 'border-red-400' : 'border-gray-200 dark:border-slate-600 focus-within:border-blue-500'
                }`}>
                  <span className="text-gray-500 dark:text-gray-300 text-sm font-mono font-semibold">+250</span>
                  <div className="w-px h-5 bg-gray-200 dark:bg-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      // always keep leading 7
                      if (!val.startsWith('7')) val = '7' + val.replace(/^7*/, '');
                      if (val.length > 9) val = val.slice(0, 9);
                      // validate second digit
                      if (val.length >= 2 && !SECOND_DIGITS[provider].includes(val[1])) return;
                      setPhone(val);
                      setPhoneError('');
                    }}
                    onKeyDown={(e) => {
                      // prevent deleting the leading 7
                      if ((e.key === 'Backspace' || e.key === 'Delete') && phone.length <= 1) e.preventDefault();
                    }}
                    placeholder={provider === 'mtn' ? '78XXXXXXX' : '72XXXXXXX'}
                    maxLength={9}
                    className="flex-1 bg-transparent text-gray-800 dark:text-white text-sm outline-none placeholder-gray-400 font-mono w-0 min-w-0"
                    autoFocus
                  />
                  <span className={`text-xs font-mono ml-auto flex-shrink-0 ${
                    phone.length === 9 ? 'text-green-500' : 'text-gray-300 dark:text-slate-600'
                  }`}>{phone.length}/9</span>
                </div>
                {phoneError
                  ? <p className="text-red-500 text-xs mt-1.5">{phoneError}</p>
                  : <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5">
                      {provider === 'mtn' ? 'MTN: 78X or 79X' : 'Airtel: 72X or 73X'}
                    </p>
                }
              </div>
            )}

            {user && (
              <div className="mb-5 flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
                <span className="text-gray-400 text-sm">📱</span>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Paying from</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.phone}</p>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handlePay}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-base transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
            >
              PAY 500 RWF NOW
            </motion.button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
              🔒 Secured by Mobile Money · Verified by AkaziConnect
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Processing ── */}
      {step === 'processing' && (
        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 flex flex-col items-center justify-center gap-3 py-12"
        >
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Processing payment…</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Please wait</p>
        </motion.div>
      )}

      {/* ── MoMo Push Sent ── */}
      {step === 'momo' && paymentData && (
        <motion.div key="momo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-600"
        >
          <div className="bg-yellow-400 px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">📲</span>
            <div>
              <p className="text-yellow-900 font-bold">Check your phone!</p>
              <p className="text-yellow-800 text-xs">Approve the MoMo request</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-5 py-5">
            <div className="flex flex-col gap-3 mb-5">
              {['Open the MTN MoMo notification on your phone', 'Enter your MoMo PIN to approve 500 RWF', 'This page will update automatically once approved'].map((txt, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{txt}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between mb-5 text-xs text-gray-500 dark:text-gray-400">
              <span>Ref: <span className="font-mono font-semibold">{paymentData.reference}</span></span>
              <span className="font-bold text-gray-800 dark:text-white">500 RWF</span>
            </div>

            {/* Auto-detection indicator */}
            <div className="flex items-center justify-center gap-2 py-3 mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Waiting for your approval…</p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4">Page updates automatically — no button needed</p>

            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <button onClick={() => setStep('deposit')}
              className="w-full text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-3 transition-colors"
            >
              ← Go back
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Waiting ── */}
      {step === 'waiting' && (
        <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-600"
        >
          <div className="bg-green-500 px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-white font-bold">Payment Received!</p>
              <p className="text-green-100 text-xs">Awaiting admin confirmation</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-5 py-5 text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-3xl mx-auto mb-3">⏳</div>
            <p className="font-bold text-gray-800 dark:text-white mb-1">Verifying your payment</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">The admin is reviewing your payment. Once confirmed, the worker's contact will be unlocked.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Usually takes a few minutes · Refresh to check</p>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
