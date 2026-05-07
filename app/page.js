'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useT } from '@/lib/LangContext';

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const slides = [
  {
    id: 0, icon: '🔧', category: 'Plumbing', label: 'Expert Plumbers',
    desc: 'Pipe repairs, installations & water systems',
    src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1400&q=80',
    fallbackColor: 'from-blue-800 to-blue-600',
  },
  {
    id: 1, icon: '⚡', category: 'Electrical', label: 'Certified Electricians',
    desc: 'Wiring, installations & electrical repairs',
    src: 'https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?auto=format&fit=crop&w=1400&q=80',
    fallbackColor: 'from-yellow-800 to-yellow-600',
  },
  {
    id: 2, icon: '🧹', category: 'Cleaning', label: 'Professional Cleaners',
    desc: 'Home, office & deep cleaning services',
    src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80',
    fallbackColor: 'from-green-800 to-green-600',
  },
  {
    id: 3, icon: '🏗️', category: 'Construction', label: 'Skilled Builders',
    desc: 'Construction, renovation & masonry work',
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80',
    fallbackColor: 'from-orange-800 to-orange-600',
  },
  {
    id: 4, icon: '🚚', category: 'Delivery', label: 'Reliable Drivers',
    desc: 'Fast & safe delivery across Kigali',
    src: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=80',
    fallbackColor: 'from-purple-800 to-purple-600',
  },
];

function SlideBackground({ slide }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [slide.id]);

  if (imgError) {
    return (
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.fallbackColor}`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <span className="text-[20rem] select-none">{slide.icon}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.src}
        alt={slide.label}
        onError={() => setImgError(true)}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/55" />
    </>
  );
}

export default function HomePage() {
  const t = useT();
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('Kigali');
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 12000);
    return () => clearInterval(timer);
  }, [next, isHovered]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (location) params.set('location', location);
    if (activeCategory) params.set('category', activeCategory);
    router.push(`/workers?${params.toString()}`);
  };

  const slide = slides[current];

  const stats = [
    { value: '500+', label: t('home.statsWorkers'),    icon: '👷' },
    { value: '12',   label: t('home.statsDistricts'),  icon: '📍' },
    { value: '5',    label: t('home.statsCategories'), icon: '🗂️' },
    { value: '4.8★', label: t('home.statsRating'),     icon: '⭐' },
  ];

  const steps = [
    { icon: '🔍', title: t('home.step1Title'), desc: t('home.step1Desc') },
    { icon: '👤', title: t('home.step2Title'), desc: t('home.step2Desc') },
    { icon: '📞', title: t('home.step3Title'), desc: t('home.step3Desc') },
  ];

  return (
    <main className="overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        className="relative w-full h-[520px] sm:h-[560px] md:h-[620px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <SlideBackground slide={slide} />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 h-full flex flex-col justify-center gap-12 py-8 px-4 sm:px-8">

          {/* Search bar — centered at top */}
          <div className="w-full max-w-2xl mx-auto">
            <motion.form
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleSearch}
              className="bg-white dark:bg-slate-800 rounded-xl p-1.5 flex flex-row gap-1.5 shadow-2xl"
            >
              <input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-800 dark:text-white bg-transparent rounded-lg outline-none text-sm placeholder-gray-400 min-w-0"
              />
              <div className="w-px bg-gray-200 dark:bg-slate-600 my-1.5" />
              <input
                type="text"
                placeholder="📍 Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-28 px-3 py-3 text-gray-800 dark:text-white bg-transparent rounded-lg outline-none text-sm placeholder-gray-400"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
              >
                {t('home.searchBtn')}
              </button>
            </motion.form>
          </div>

          {/* Slide text — left aligned below */}
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${slide.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-start gap-3"
              >
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/25">
                  {slide.icon} {slide.category} · AkaziConnect 🇷🇼
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                  {slide.label}
                </h1>
                <p className="text-white/75 text-sm sm:text-base drop-shadow">
                  {slide.desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slide controls */}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={prev} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl transition-colors" aria-label="Previous slide">‹</button>
              <div className="flex gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrent(i)}
                    aria-label={`Go to ${s.category}`}
                    className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                    style={{ width: i === current ? 28 : 8, background: i === current ? 'white' : 'rgba(255,255,255,0.4)' }}
                  >
                    {i === current && !isHovered && (
                      <motion.span
                        className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 12, ease: 'linear' }}
                        key={`progress-${current}`}
                      />
                    )}
                  </button>
                ))}
              </div>
              <button onClick={next} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl transition-colors" aria-label="Next slide">›</button>
              <span className="text-white/40 text-xs ml-2">{current + 1} / {slides.length}</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <motion.div
          className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('home.browseTitle')}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('home.browseSubtitle')}</p>
        </motion.div>

        {categories.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            {categories.map((cat) => (
              <motion.button
                key={cat._id}
                variants={fadeUp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory((p) => p === cat.slug ? null : cat.slug)}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 ${
                  activeCategory === cat.slug
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                    : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md'
                }`}
              >
                <span className="text-3xl sm:text-4xl">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{cat.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        <AnimatePresence>
          {activeCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center mt-8"
            >
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {t('home.findBtn')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 dark:bg-slate-800/60 py-14 px-4">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">
            {t('home.howTitle')}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white dark:bg-slate-900 py-14 px-4 border-t border-gray-100 dark:border-slate-700">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">What people say</h2>
        </motion.div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { name: 'Amina K.',  role: 'Customer',    text: 'Found a plumber in 5 minutes. Amazing!' },
            { name: 'Jean P.',   role: 'Electrician', text: 'I get new clients every week through AkaziConnect.' },
            { name: 'Grace M.',  role: 'Customer',    text: 'Very easy to use, even for my parents.' },
          ].map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700"
            >
              <div className="flex text-yellow-400 text-sm mb-3">★★★★★</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-4">"{r.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                  {r.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-white">{r.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 bg-gray-50 dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl"
        >
          <div className="text-4xl mb-4">🇷🇼</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('home.ctaTitle')}</h2>
          <p className="text-blue-100 mb-8 text-sm sm:text-base max-w-md mx-auto">{t('home.ctaSubtitle')}</p>
          <a
            href="/register-worker"
            className="inline-block bg-white text-blue-600 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t('home.ctaBtn')}
          </a>
        </motion.div>
      </section>

    </main>
  );
}
