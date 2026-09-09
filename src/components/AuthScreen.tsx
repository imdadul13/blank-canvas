import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Target,
  Zap,
  Copy,
  Check,
  PlayCircle,
  Sparkles,
  BookOpen,
  Activity,
  Award,
  Stethoscope,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveAuthError } from '../utils/authErrors';
import OneShotLogo from './OneShotLogo';

/* ─── Google colour SVG ─── */
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

/* ─── Shared input style ─── */
const inputCls =
  'rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm focus:border-[#006B63] focus:bg-white focus:ring-1 focus:ring-[#006B63] focus:outline-none w-full text-stone-900 placeholder:text-stone-400 transition-all';

/* ─── Aesthetic Clinical & Anatomical Background Artwork (Apple-Grade) ─── */
const BackgroundArt: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
    {/* Soft Ethereal Multi-Hue Aurora Mesh */}
    <motion.div
      animate={{
        scale: [1, 1.12, 1],
        opacity: [0.4, 0.55, 0.4],
      }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-32 right-1/4 h-[550px] w-[700px] rounded-full bg-gradient-to-br from-[#006B63]/18 via-teal-400/12 to-transparent blur-[140px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.25, 0.4, 0.25],
      }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      className="absolute top-1/3 -left-32 h-[500px] w-[600px] rounded-full bg-gradient-to-tr from-[#B57B66]/18 via-amber-400/12 to-transparent blur-[140px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.35, 0.2],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      className="absolute -bottom-32 right-10 h-[500px] w-[600px] rounded-full bg-gradient-to-tl from-emerald-500/18 via-cyan-400/10 to-transparent blur-[150px]"
    />

    {/* Subtle Tactile Dot Grid */}
    <div className="absolute inset-0 bg-[radial-gradient(#006B63_1px,transparent_1px)] opacity-[0.035] [background-size:24px_24px]" />

    {/* Concentric Medical Radar & Telemetry Rings (Anchored behind the right preview card) */}
    <svg
      className="absolute right-0 top-1/2 -translate-y-1/2 h-[750px] w-[750px] opacity-[0.05] stroke-[#006B63] fill-none pointer-events-none hidden lg:block"
      viewBox="0 0 600 600"
    >
      <circle cx="300" cy="300" r="120" strokeWidth="1" />
      <circle cx="300" cy="300" r="200" strokeWidth="1" strokeDasharray="6 6" />
      <circle cx="300" cy="300" r="280" strokeWidth="0.75" strokeDasharray="3 6" />
      <line x1="300" y1="20" x2="300" y2="580" strokeWidth="0.5" strokeDasharray="4 6" />
      <line x1="20" y1="300" x2="580" y2="300" strokeWidth="0.5" strokeDasharray="4 6" />
    </svg>

    {/* Continuous Horizontal ECG Rhythm Line across lower screen */}
    <div className="absolute bottom-12 left-0 right-0 h-10 opacity-[0.06] overflow-hidden pointer-events-none">
      <svg viewBox="0 0 1200 40" className="w-full h-full stroke-[#006B63] fill-none stroke-[1.5]" preserveAspectRatio="none">
        <path d="M 0 20 L 200 20 L 210 10 L 218 35 L 226 5 L 234 25 L 242 20 L 600 20 L 610 10 L 618 35 L 626 5 L 634 25 L 642 20 L 1000 20 L 1010 10 L 1018 35 L 1026 5 L 1034 25 L 1042 20 L 1200 20" />
      </svg>
    </div>
  </div>
);

/* ─── Today's Clinical Plan Preview Card (Ultra-Crisp, Zero-Overlap) ─── */
const StudyDashIllustration: React.FC = () => (
  <div className="w-full max-w-sm mx-auto select-none space-y-4">
    {/* Header: Focus Pill & Day Status */}
    <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[10.5px] font-extrabold text-teal-900 flex items-center gap-1.5 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
          TODAY'S FOCUS
        </span>
        <span className="px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-[10.5px] font-extrabold text-sky-900 shadow-2xs">
          GENERAL MEDICINE
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100/90 border border-stone-200/80 text-[11px] font-semibold text-stone-700 shadow-2xs">
        <Stethoscope className="h-3.5 w-3.5 text-[#006B63]" />
        <span>Day 42 Plan</span>
      </div>
    </div>

    {/* Primary Clinical Topic */}
    <div className="space-y-1">
      <h3 className="text-xl font-extrabold tracking-[-0.025em] text-stone-900 leading-tight">
        Cardiology — Arrhythmias, Heart Blocks &amp; MI
      </h3>
      <p className="text-xs text-stone-500 leading-relaxed font-normal">
        Work through clinical slides, high-yield flashcards, and 10 targeted NBE MCQs.
      </p>
    </div>

    {/* 4 Clinical Metric Badges */}
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] font-semibold text-stone-700 shadow-2xs">
        <Calendar className="h-3 w-3 text-stone-500" />
        35 marks
      </span>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] font-semibold text-stone-700 shadow-2xs">
        <Clock className="h-3 w-3 text-stone-500" />
        30 min
      </span>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-[11px] font-bold text-teal-800 shadow-2xs">
        <BookOpen className="h-3 w-3 text-teal-600" />
        Clinical MCQ
      </span>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] font-bold text-rose-700 shadow-2xs">
        <Zap className="h-3 w-3 text-rose-500" />
        High-yield
      </span>
    </div>

    {/* Telemetry Vitals Bar */}
    <div className="rounded-xl border border-teal-600/20 bg-gradient-to-r from-teal-950/[0.04] via-teal-900/[0.02] to-emerald-500/[0.04] p-3 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006B63]" />
        </span>
        <span className="text-xs font-semibold text-stone-800 font-mono">Telemetry: Lead II Normal · 72 BPM</span>
      </div>
      <svg viewBox="0 0 80 18" className="h-4 w-20 stroke-[#006B63] fill-none stroke-[1.8] opacity-85">
        <path d="M 0 9 L 20 9 L 24 3 L 28 15 L 32 5 L 36 9 L 80 9" />
      </svg>
    </div>

    {/* Up Next Priority Subjects */}
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">
        <span>Up Next In Priority</span>
        <span>Weight</span>
      </div>
      {[
        {
          subject: 'General Surgery',
          topic: 'Primary Survey, FAST & Burns',
          weight: '35M High-Yield',
          accent: 'bg-[#B57B66]',
          pill: 'bg-amber-50 text-amber-800 border-amber-200/90',
        },
        {
          subject: 'Obstetrics & Gyn',
          topic: 'Preeclampsia & MgSO4 Regimen',
          weight: '30M High-Yield',
          accent: 'bg-[#9D4B66]',
          pill: 'bg-rose-50 text-rose-800 border-rose-200/90',
        },
      ].map((item) => (
        <div
          key={item.subject}
          className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 bg-white/95 shadow-2xs hover:border-stone-300 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`h-2 w-2 rounded-full ${item.accent} shrink-0 ring-2 ring-stone-100`} />
            <div className="min-w-0">
              <span className="text-xs font-bold text-stone-900 truncate block">{item.subject}</span>
              <span className="text-[11px] text-stone-500 truncate block font-normal">{item.topic}</span>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${item.pill}`}>
            {item.weight}
          </span>
        </div>
      ))}
    </div>

    {/* Executive Readiness Score Module */}
    <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-stone-50/90 to-teal-50/20 p-4 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-teal-50 border border-teal-200/60">
            <Award className="h-3.5 w-3.5 text-[#006B63]" />
          </div>
          <span className="text-xs font-bold text-stone-800">FMGE Readiness Index</span>
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-base font-extrabold text-[#006B63]">182</span>
          <span className="text-xs text-stone-400 font-medium">/ 300</span>
        </div>
      </div>

      {/* Precision Calibrated Meter */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-stone-200/90 rounded-full overflow-hidden relative p-[1px]">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
            style={{ left: '50%' }}
            title="Pass Threshold: 150"
          />
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '68%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#10B981] rounded-full shadow-xs"
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono pt-0.5">
          <span>0 Baseline</span>
          <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
            150 Pass Line
          </span>
          <span className="text-[#006B63] font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
            +32 Safety Buffer
          </span>
        </div>
      </div>

      {/* Integrated Status Chips inside Card Footer (Zero Collision) */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-200/70 text-[11px]">
        <span className="font-bold text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          99.2% Retention
        </span>
        <span className="font-bold text-teal-700 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          +38 Marks Projected
        </span>
        <span className="text-stone-500 font-medium hidden sm:inline">
          Day 42 Pace
        </span>
      </div>
    </div>
  </div>
);

type AuthMode = 'welcome' | 'signin' | 'signup' | 'forgot';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const clearMessages = () => {
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
  };

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'google', currentHost);
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      await signInWithEmail(cleanEmail, password);
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'signin');
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = displayName.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter your email and a secure password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      await signUpWithEmail(cleanEmail, password, cleanName || 'Dr. Aspirant');
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'signup');
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address to receive password reset instructions.');
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      await sendPasswordReset(cleanEmail);
      setIsLoading(false);
      setSuccessMsg('Password reset link sent! Please check your inbox.');
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'forgot');
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const handleGuestEntry = () => {
    continueAsGuest(displayName.trim() || 'Dr. Aspirant');
  };

  /* ─────────────────────────────────────────────────────────────
     1. WELCOME SCREEN (Minimal & Aesthetic Editorial Theme)
  ───────────────────────────────────────────────────────────── */
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-[#FAFBFB] flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden font-['Plus_Jakarta_Sans'] text-stone-900">
        {/* Dynamic Ethereal Background Artwork */}
        <BackgroundArt />

        {/* Top Header Brand */}
        <header className="relative w-full max-w-6xl mx-auto flex items-center justify-between py-3.5 z-10">
          <OneShotLogo variant="horizontal" showTagline={true} taglineText="300 Marks Blueprint" />

          <div className="flex items-center gap-2 text-xs text-stone-600 font-medium px-3.5 py-1.5 rounded-full border border-stone-200/80 bg-white/85 backdrop-blur-md shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span className="hidden sm:inline">Offline &amp; Cloud Sync Active</span>
            <span className="sm:hidden">Online</span>
          </div>
        </header>

        {/* Main Hero Container */}
        <main className="relative w-full max-w-6xl mx-auto my-auto py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center z-10">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100/90 border border-stone-200/80 text-xs font-semibold text-stone-700">
                <Sparkles className="h-3.5 w-3.5 text-[#006B63]" />
                <span>Deterministic FMGE Preparation</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-stone-900 tracking-[-0.035em] leading-[1.08]">
                Master high-yield topics in{' '}
                <span className="bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#0284C7] bg-clip-text text-transparent">one shot</span>.
              </h1>

              <p className="text-base sm:text-[17px] text-stone-600 max-w-xl font-normal leading-relaxed tracking-[-0.01em]">
                Know what to study. Practice what matters. Fix what you get wrong. A clean, closed-loop clinical intelligence platform designed for first-attempt FMGE success.
              </p>
            </div>

            {/* 3 Value Propositions with Dynamic Accents & Motion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative rounded-2xl border border-stone-200/80 bg-white/85 backdrop-blur-md p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-teal-300 hover:shadow-[0_8px_24px_rgba(0,107,99,0.08)] transition-all cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-50 border border-teal-200/60 text-[#006B63] shadow-2xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 tracking-tight">19 Subjects</span>
                </div>
                <p className="text-xs text-stone-500 mt-2 leading-snug">NBE weighted blueprint &amp; clinical pearls</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative rounded-2xl border border-stone-200/80 bg-white/85 backdrop-blur-md p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-amber-300 hover:shadow-[0_8px_24px_rgba(181,123,102,0.08)] transition-all cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-[#B57B66] shadow-2xs">
                    <Target className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 tracking-tight">Adaptive Priority</span>
                </div>
                <p className="text-xs text-stone-500 mt-2 leading-snug">Dynamic 0–100 mastery tracking</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative rounded-2xl border border-stone-200/80 bg-white/85 backdrop-blur-md p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-300 hover:shadow-[0_8px_24px_rgba(99,102,241,0.08)] transition-all cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200/60 text-[#6366F1] shadow-2xs">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 tracking-tight">Closed-Loop</span>
                </div>
                <p className="text-xs text-stone-500 mt-2 leading-snug">Error Vault remediation &amp; recall</p>
              </motion.div>
            </div>

            {/* Crisp Apple-Style CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
                onClick={() => {
                  clearMessages();
                  setMode('signup');
                }}
                className="rounded-full bg-[#006B63] hover:bg-[#005750] text-white px-8 py-3.5 text-sm font-bold tracking-tight shadow-[0_6px_20px_rgba(0,107,99,0.25)] hover:shadow-[0_10px_28px_rgba(0,107,99,0.35)] transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  clearMessages();
                  setMode('signin');
                }}
                className="rounded-full border border-stone-300/80 bg-white/90 hover:bg-white hover:border-stone-400 text-stone-800 px-7 py-3.5 text-sm font-semibold tracking-tight transition-all flex items-center justify-center cursor-pointer shadow-2xs focus:outline-none"
              >
                Sign In
              </motion.button>
            </div>

            {/* Guest Practice Mode */}
            <div className="pt-1">
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleGuestEntry}
                className="group inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full border border-stone-200/90 bg-white/80 hover:bg-white text-xs font-semibold text-stone-600 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
              >
                <PlayCircle className="h-4 w-4 text-[#006B63]" />
                <span>Continue in Local Practice Mode (Instant Access · No Sign-in)</span>
                <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all" />
              </motion.button>
            </div>
          </div>

          {/* Right Column: Dynamic Luxury Telemetry Card (Zero Collisions) */}
          <div className="hidden lg:block lg:col-span-5 relative">
            {/* Ambient card backlight glow */}
            <div className="absolute -inset-3 bg-gradient-to-tr from-teal-500/12 via-emerald-500/8 to-amber-500/10 rounded-[38px] blur-2xl pointer-events-none" />

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-3xl border border-stone-200/90 bg-white/95 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,107,99,0.08)] backdrop-blur-xl relative z-10"
            >
              <StudyDashIllustration />
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative w-full max-w-6xl mx-auto py-3 text-center text-xs text-stone-400 z-10">
          ONE SHOT FMGE · Clinical Intelligence Platform
        </footer>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. AUTH MODES (Sign In / Sign Up / Forgot Password)
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FAFBFB] text-stone-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Dynamic Background Artwork */}
      <BackgroundArt />

      <div className="w-full max-w-md relative z-10">
        {/* Back to welcome */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode('welcome');
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Back to Welcome</span>
          </button>
          <span className="text-xs text-stone-400 font-mono tracking-wider">ONE SHOT</span>
        </div>

        {/* Main Auth Card */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-7 sm:p-9 shadow-[0_12px_36px_rgba(0,0,0,0.03)]">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex mb-3.5">
              <OneShotLogo variant="icon" size="lg" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-stone-900">
              {mode === 'signin' && 'Sign in to ONE SHOT'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset password'}
            </h1>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed font-normal">
              {mode === 'signin' && 'Welcome back, Doctor. Pick up your high-yield FMGE plan.'}
              {mode === 'signup' && 'Set up your personalized FMGE target and daily rhythm.'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
              </div>
              {errorCode === 'auth/unauthorized-domain' && (
                <div className="pt-2 border-t border-red-200 flex items-center justify-between bg-white/90 p-2 rounded-xl">
                  <span className="font-mono text-[11px] truncate text-red-900 max-w-[200px]">{currentHost}</span>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="text-[11px] font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 shrink-0"
                  >
                    {copiedDomain ? 'Copied!' : 'Copy Domain'}
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/80 p-3.5 text-xs text-teal-800">
              <CheckCircle2 className="h-4 w-4 text-[#006B63] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign In Option */}
          {mode !== 'forgot' && (
            <div className="space-y-3 mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 rounded-full border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.985] px-4 py-3 text-xs font-semibold text-stone-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon className="h-4 w-4" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-stone-100" />
                <span className="absolute bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-stone-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('forgot');
                    }}
                    className="text-xs font-medium text-stone-500 hover:text-[#006B63] cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#006B63] hover:bg-[#005750] active:scale-[0.985] text-white font-semibold py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(0,107,99,0.2)] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signup');
                  }}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer"
                >
                  Create account
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">Doctor / Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. Aman Sharma"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#006B63] hover:bg-[#005750] active:scale-[0.985] text-white font-semibold py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(0,107,99,0.2)] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">Your Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#006B63] hover:bg-[#005750] active:scale-[0.985] text-white font-semibold py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(0,107,99,0.2)] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="text-xs font-semibold text-[#006B63] hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Local Mode fallback */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleGuestEntry}
            className="text-xs text-stone-500 hover:text-stone-900 font-medium underline underline-offset-4 transition-colors cursor-pointer"
          >
            Start instantly in Local Practice Mode
          </button>
        </div>
      </div>
    </div>
  );
};
