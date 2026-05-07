'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function RegistrationFeePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState('intro'); // intro | ussd | done
  const [paymentData, setPaymentData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  const initiate = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/payments/registration/initiate');
      setPaymentData(data);
      setStep('ussd');
    } catch (err) {
      if (err.response?.data?.message === 'Registration fee already paid') {
        setStep('done');
      } else {
        setError(err.response?.data?.message || 'Failed to initiate payment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.put('/payments/registration/confirm');
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setSubmitting(false);
    }
  };

  const copyUssd = () => {
    navigator.clipboard.writeText(paymentData.ussdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <AnimatePresence mode="wait">

        {/* Intro */}
        {step === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center shadow-sm"
          >
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Profile Created!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              One last step — pay the <span className="font-bold text-blue-600 dark:text-blue-400">2,000 RWF</span> registration fee via MTN MoMo to activate your profile and start receiving customers.
            </p>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 text-left text-sm flex flex-col gap-2">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Registration fee</span>
                <span className="font-semibold">2,000 RWF</span>
              </div>
              <div className="flex justify-between text-gray-400 dark:text-gray-500 text-xs">
                <span>One-time payment</span>
                <span>MTN MoMo</span>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={initiate} disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Loading…' : 'Pay 2,000 RWF to Activate →'}
            </motion.button>
          </motion.div>
        )}

        {/* USSD */}
        {step === 'ussd' && paymentData && (
          <motion.div key="ussd" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm"
          >
            <h2 className="font-bold text-gray-800 dark:text-white mb-1">Dial this USSD code</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Open your phone dialer and send <span className="font-semibold text-blue-600 dark:text-blue-400">2,000 RWF</span> via MTN MoMo
            </p>

            {/* USSD box */}
            <div className="bg-gray-900 dark:bg-black rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
              <span className="text-green-400 font-mono text-lg font-bold tracking-widest">{paymentData.ussdCode}</span>
              <button onClick={copyUssd}
                className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-5 text-xs text-blue-700 dark:text-blue-300 flex flex-col gap-1">
              <p>1. Open your phone dialer</p>
              <p>2. Dial <span className="font-mono font-bold">{paymentData.ussdCode}</span></p>
              <p>3. Follow MTN MoMo prompts to confirm 2,000 RWF</p>
              <p>4. Come back and click <span className="font-semibold">"I've Paid"</span></p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-5 px-1">
              <span>Ref: <span className="font-mono">{paymentData.reference}</span></span>
              <span>To: {paymentData.adminMomo}</span>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={confirm} disabled={submitting}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : "✓ I've Paid"}
            </motion.button>
          </motion.div>
        )}

        {/* Done */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center shadow-sm"
          >
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Payment Submitted!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              The admin will verify your payment and activate your profile shortly. You'll be visible to customers once approved.
            </p>
            <button onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Back to Home
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
