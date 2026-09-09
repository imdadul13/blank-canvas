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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveAuthError } from '../utils/authErrors';
import OneShotLogo from './OneShotLogo';

/* ─── ONE SHOT brand mark ─── */
const OneShotMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims =
    size === 'sm'
      ? 'h-8 w-8'
      : size === 'lg'
      ? 'h-16 w-16'
      : 'h-11 w-11';
  return (
    <div className={`relative flex items-center justify-center rounded-2xl bg-white border border-[#006B63]/20 shadow-xs overflow-hidden p-1.5 ${dims}`}>
      <img
        src="/images/brand/one_shot_emblem.png"
        alt="ONE SHOT FMGE"
        className="h-full w-full object-contain rounded-xl"
      />
    </div>
  );
};

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
  'rounded-xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-sm focus:border-[#006B63] focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none w-full text-slate-800 placeholder:text-stone-400 transition-all';

/* ─── Decorative right-panel study dashboard illustration (Elevated System Theme) ─── */
const StudyDashIllustration: React.FC = () => (
  <motion.div
    animate={{ y: [0, -5, 0] }}
    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    className="flex flex-col gap-3.5 w-full max-w-sm mx-auto select-none"
  >
    <div className="flex items-center justify-between mb-1">
      <div>
        <p className="text-[10px] font-mono font-bold text-[#006B63] uppercase tracking-wider">
          Today's Clinical Target
        </p>
        <p className="text-base font-bold font-['Outfit'] text-slate-800">Cardiology &amp; Trauma · Day 42</p>
      </div>
      <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-200/70 flex items-center justify-center text-[#006B63] font-bold text-xs shadow-2xs">
        Dr
      </div>
    </div>
    {[
      {
        subject: 'General Medicine',
        topic: 'ECGs & Arrhythmias',
        time: '20 min',
        weight: '35M',
        bg: 'bg-teal-50/50 border-teal-200/60',
        dot: 'bg-[#006B63]',
        badge: 'bg-teal-100/70 text-[#004D47]',
        pulse: true,
      },
      {
        subject: 'General Surgery',
        topic: 'Trauma & ATLS Protocol',
        time: '25 min',
        weight: '35M',
        bg: 'bg-amber-50/50 border-amber-200/60',
        dot: 'bg-[#B57B66]',
        badge: 'bg-amber-100/70 text-[#B57B66]',
        pulse: false,
      },
      {
        subject: 'Obstetrics & Gyn',
        topic: 'Preeclampsia & MgSO4',
        time: '15 min',
        weight: '30M',
        bg: 'bg-rose-50/40 border-rose-200/50',
        dot: 'bg-rose-500',
        badge: 'bg-rose-100/60 text-rose-700',
        pulse: false,
      },
    ].map((item) => (
      <div
        key={item.topic}
        className={`flex items-center gap-3 rounded-2xl border ${item.bg} p-3.5 shadow-2xs transition-all duration-200 hover:scale-[1.01]`}
      >
        <div className="relative shrink-0 flex items-center justify-center">
          {item.pulse && (
            <span className="absolute h-4 w-4 rounded-full bg-teal-400/40 animate-ping" />
          )}
          <div className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{item.subject}</p>
          <p className="text-[11px] text-stone-500 truncate">{item.topic} · {item.time}</p>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${item.badge}`}>
          {item.weight}
        </span>
      </div>
    ))}

    <div className="rounded-2xl bg-white border border-stone-200/90 p-4 shadow-xs space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-stone-600">Readiness Score</span>
        <span className="text-sm font-black font-['Outfit'] text-[#006B63]">182 / 300</span>
      </div>
      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden p-0.5">
        <div className="h-full w-[68%] bg-gradient-to-r from-[#006B63] to-[#00897B] rounded-full shadow-xs" />
      </div>
      <div className="flex justify-between items-center text-[10px] pt-0.5">
        <span className="text-stone-400">19 FMGE Subjects Active</span>
        <span className="font-bold text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Passing Track (+32 buffer)
        </span>
      </div>
    </div>
  </motion.div>
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
     1. WELCOME SCREEN (Elevated Circadian System Theme)
  ───────────────────────────────────────────────────────────── */
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4FAF8] via-[#FAF9F6] to-[#EBF6F3] flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden font-['Plus_Jakarta_Sans']">
        {/* Breathing Circadian Auroras & ECG Telemetry Rhythm */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 20, 0],
              y: [0, -15, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -right-32 w-[540px] h-[540px] rounded-full bg-gradient-to-br from-teal-300/35 via-emerald-200/25 to-transparent blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 0.95, 1.1],
              opacity: [0.25, 0.4, 0.25],
              x: [0, -15, 0],
              y: [0, 20, 0],
            }}
            transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-36 -left-36 w-[540px] h-[540px] rounded-full bg-gradient-to-tr from-amber-200/30 via-teal-100/20 to-transparent blur-3xl"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
            <svg viewBox="0 0 800 140" className="w-full max-w-4xl stroke-[#006B63] fill-none stroke-[2]">
              <path d="M 0 70 L 240 70 L 260 45 L 280 100 L 300 20 L 320 120 L 340 60 L 360 80 L 380 70 L 800 70" />
            </svg>
          </div>
        </div>

        {/* Top Header Brand */}
        <header className="relative w-full max-w-6xl mx-auto flex items-center justify-between py-2 z-10">
          <div className="flex items-center gap-3">
            <OneShotMark size="md" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 font-['Outfit']">
                ONE SHOT <span className="text-[#006B63]">FMGE</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-[#006B63] border border-teal-500/20 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#006B63]" />
                300 Marks Blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-600 font-semibold px-3 py-1.5 rounded-full bg-white/80 border border-stone-200/80 shadow-2xs backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-[#006B63]" />
            <span className="hidden sm:inline">Encrypted Offline &amp; Cloud Sync</span>
          </div>
        </header>

        {/* Main Hero Container */}
        <main className="relative w-full max-w-6xl mx-auto my-auto py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center z-10">
          {/* Left Column: Brand & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-[#006B63] border border-teal-500/20 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-[#006B63]" />
                <span>Your FMGE. One focused plan.</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-['Newsreader',_serif] font-semibold text-slate-900 tracking-tight leading-[1.12]">
                Master high-yield topics in one shot.
              </h1>
              <p className="text-base sm:text-[17px] text-stone-600 max-w-xl leading-relaxed">
                Know what to study. Practice what matters. Fix what you get wrong. A deterministic, closed-loop system designed for first-attempt FMGE success.
              </p>
            </div>

            {/* 3 Value Propositions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-[#006B63]" />
                  <span>19 Subjects</span>
                </div>
                <p className="text-[11.5px] text-stone-500 mt-1 leading-snug">NBE weighted blueprint</p>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Target className="h-4 w-4 text-[#B57B66]" />
                  <span>Adaptive Priority</span>
                </div>
                <p className="text-[11.5px] text-stone-500 mt-1 leading-snug">Topic priority 0–100</p>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Zap className="h-4 w-4 text-[#00897B]" />
                  <span>Closed-Loop</span>
                </div>
                <p className="text-[11.5px] text-stone-500 mt-1 leading-snug">Error Vault remediation</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('signup');
                }}
                className="group flex-1 rounded-full bg-[#006B63] hover:bg-[#00544E] active:scale-[0.98] text-white px-7 py-4 text-sm sm:text-base font-semibold shadow-lg shadow-teal-950/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('signin');
                }}
                className="rounded-full border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-slate-800 px-7 py-4 text-sm sm:text-base font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B63]"
              >
                Sign In
              </button>
            </div>

            {/* Local Practice Mode Option Pill */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGuestEntry}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-teal-600/20 bg-teal-50/70 hover:bg-teal-50 hover:border-teal-400 text-xs font-semibold text-[#006B63] shadow-2xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                <PlayCircle className="h-3.5 w-3.5 text-[#006B63]" />
                <span>Continue directly in Local Practice Mode (No sign-in required)</span>
                <ArrowRight className="h-3 w-3 text-teal-600/70 group-hover:text-[#006B63] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Study Preview Card (Desktop) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="rounded-3xl border border-stone-200/90 bg-white/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md">
              <StudyDashIllustration />
            </div>
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
    <div className="min-h-screen bg-gradient-to-b from-[#F4FAF8] via-[#FAF9F6] to-[#EBF6F3] text-stone-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient auroras */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] h-[460px] w-[460px] rounded-full bg-teal-300/30 blur-[90px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute -bottom-32 left-[-10%] h-[460px] w-[460px] rounded-full bg-amber-200/25 blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(#006B63_0.5px,transparent_0.5px)] opacity-[0.035] [background-size:24px_24px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to welcome */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode('welcome');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#006B63] transition-colors cursor-pointer group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Back to Welcome</span>
          </button>
          <span className="text-xs text-stone-400 font-mono tracking-wider">ONE SHOT</span>
        </div>

        {/* Main Auth Card */}
        <div className="rounded-3xl border border-stone-200/90 bg-white/95 p-6 sm:p-8 shadow-xl shadow-teal-950/5 backdrop-blur-xl">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex mb-3">
              <OneShotMark size="md" />
            </div>
            <h1 className="text-2xl font-bold font-['Newsreader',Georgia,serif] tracking-tight text-stone-900">
              {mode === 'signin' && 'Sign In to ONE SHOT'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h1>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              {mode === 'signin' && 'Welcome back, Doctor. Pick up your high-yield FMGE plan.'}
              {mode === 'signup' && 'Set up your personalized FMGE target and daily rhythm.'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-800">
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
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/90 p-3.5 text-xs text-teal-800">
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
                className="w-full flex items-center justify-center gap-3 rounded-full border border-stone-200/90 bg-white hover:bg-stone-50/80 px-4 py-3 text-xs font-semibold text-stone-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <GoogleIcon className="h-4 w-4" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-stone-100" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Email Address</label>
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
                  <label className="text-xs font-bold text-stone-700">Password</label>
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
                className="w-full rounded-full bg-[#006B63] hover:bg-[#00544E] text-white font-bold py-3.5 text-sm transition-all shadow-md shadow-teal-950/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
                  className="text-xs font-bold text-[#006B63] hover:underline cursor-pointer"
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
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Doctor / Full Name</label>
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
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Email Address</label>
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
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Create Password</label>
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
                className="w-full rounded-full bg-[#006B63] hover:bg-[#00544E] text-white font-bold py-3.5 text-sm transition-all shadow-md shadow-teal-950/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
                  className="text-xs font-bold text-[#006B63] hover:underline cursor-pointer"
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
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Your Registered Email</label>
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
                className="w-full rounded-full bg-[#006B63] hover:bg-[#00544E] text-white font-bold py-3.5 text-sm transition-all shadow-md shadow-teal-950/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
                  className="text-xs font-bold text-[#006B63] hover:underline cursor-pointer"
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
            className="text-xs text-teal-700 hover:text-[#00544E] font-medium underline underline-offset-2 cursor-pointer"
          >
            Start instantly in Local Practice Mode
          </button>
        </div>
      </div>
    </div>
  );
};
