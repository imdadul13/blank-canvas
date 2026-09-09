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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveAuthError } from '../utils/authErrors';
import OneShotLogo from './OneShotLogo';

/* ─── ONE SHOT brand mark (Minimal & Aesthetic) ─── */
const OneShotMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims =
    size === 'sm'
      ? 'h-8 w-8'
      : size === 'lg'
      ? 'h-13 w-13'
      : 'h-10 w-10';
  return (
    <div className={`relative flex items-center justify-center rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-1.5 ${dims}`}>
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
  'rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm focus:border-[#006B63] focus:bg-white focus:ring-1 focus:ring-[#006B63] focus:outline-none w-full text-stone-900 placeholder:text-stone-400 transition-all';

/* ─── Aesthetic Clinical & Anatomical Background Artwork ─── */
const BackgroundArt: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
    {/* Dynamic Ethereal Multi-Hue Aurora Orbs */}
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.35, 0.5, 0.35],
        x: [0, 20, 0],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-32 right-1/4 h-[550px] w-[700px] rounded-full bg-gradient-to-br from-[#006B63]/20 via-teal-400/15 to-transparent blur-[130px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.25, 0.45, 0.25],
        y: [0, -30, 0],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      className="absolute top-1/3 -left-32 h-[520px] w-[640px] rounded-full bg-gradient-to-tr from-[#B57B66]/20 via-amber-400/15 to-transparent blur-[140px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.35, 0.2],
        x: [0, -25, 0],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      className="absolute -bottom-32 right-10 h-[500px] w-[620px] rounded-full bg-gradient-to-tl from-emerald-500/20 via-cyan-400/15 to-transparent blur-[140px]"
    />
    <div className="absolute top-1/2 right-1/3 h-[400px] w-[450px] rounded-full bg-indigo-500/[0.08] blur-[150px]" />

    {/* Subtle Tactile Dot Grid */}
    <div className="absolute inset-0 bg-[radial-gradient(#006B63_1px,transparent_1px)] opacity-[0.05] [background-size:24px_24px]" />

    {/* Elegant Fine-line Medical & Topological Vector Artwork */}
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.09] stroke-[#006B63] fill-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="art-grid" width="160" height="160" patternUnits="userSpaceOnUse">
          <circle cx="80" cy="80" r="1.5" fill="#006B63" fillOpacity="0.6" />
          <path d="M 0 80 L 160 80 M 80 0 L 80 160" strokeWidth="0.6" strokeDasharray="4 8" />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#art-grid)" opacity="0.8" />

      {/* Anatomical Thoracic & Cardiac Arc Topography */}
      <g strokeWidth="1" strokeDasharray="6 6">
        <circle cx="85%" cy="18%" r="180" />
        <circle cx="85%" cy="18%" r="300" strokeWidth="0.8" />
        <circle cx="85%" cy="18%" r="420" strokeWidth="0.6" strokeDasharray="4 8" />
      </g>

      {/* Flowing Clinical Cardiac Vector Contours */}
      <path
        d="M -100 450 C 150 400, 300 580, 550 490 C 800 410, 1050 620, 1400 510 C 1650 430, 1900 560, 2200 470"
        strokeWidth="1.5"
      />
      <path
        d="M -100 490 C 180 440, 330 620, 580 530 C 830 450, 1080 660, 1430 550 C 1680 470, 1930 600, 2200 510"
        strokeWidth="0.9"
        strokeDasharray="4 6"
      />

      {/* Medical Crosshairs & Datum Points */}
      <g strokeWidth="1">
        <path d="M 120 120 L 140 120 M 130 110 L 130 130" />
        <path d="M 90% 65% L calc(90% + 20px) 65% M calc(90% + 10px) calc(65% - 10px) L calc(90% + 10px) calc(65% + 10px)" />
        <path d="M 20% 85% L calc(20% + 20px) 85% M calc(20% + 10px) calc(85% - 10px) L calc(20% + 10px) calc(85% + 10px)" />
      </g>
    </svg>
  </div>
);

/* ─── Premium Clinical Prescription Card (High-Craft Luxury) ─── */
const StudyDashIllustration: React.FC = () => (
  <div className="w-full max-w-sm mx-auto select-none space-y-4 relative">
    {/* Micro crosshair badge in corner */}
    <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 text-[9px] font-mono font-semibold text-teal-700/60 pointer-events-none">
      <span className="text-teal-600">+</span>
      <span>NBE-VERIFIED BLUEPRINT</span>
    </div>

    {/* Header: Prescription Ribbon */}
    <div className="pb-3 border-b border-stone-200/80 flex items-start justify-between gap-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006B63]" />
          </span>
          <p className="text-[10px] font-mono font-bold text-[#006B63] uppercase tracking-wider">
            Daily Clinical Plan · Day 42
          </p>
        </div>
        <h3 className="text-lg font-semibold font-['Newsreader',_serif] text-stone-900 tracking-tight leading-snug">
          Cardiology &amp; Acute Trauma
        </h3>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 text-[11px] font-bold text-teal-900 shadow-2xs">
        <Stethoscope className="h-3.5 w-3.5 text-[#006B63]" />
        <span>Dr. Practice</span>
      </div>
    </div>

    {/* Telemetry Vitals Bar */}
    <div className="rounded-xl border border-teal-600/20 bg-gradient-to-r from-teal-950/[0.05] via-teal-900/[0.02] to-emerald-500/[0.04] p-2.5 px-3 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-[#006B63] animate-pulse" />
        <span className="text-[11px] font-mono text-stone-700 font-semibold">Telemetry: Lead II Normal · 72 BPM</span>
      </div>
      <svg viewBox="0 0 80 18" className="h-4 w-20 stroke-[#006B63] fill-none stroke-[1.8] opacity-85">
        <path d="M 0 9 L 20 9 L 24 3 L 28 15 L 32 5 L 36 9 L 80 9" />
      </svg>
    </div>

    {/* 3 Tactile Clinical Priority Subjects */}
    <div className="space-y-2.5">
      {[
        {
          subject: 'General Medicine',
          subtag: 'Core Cardiology',
          topic: 'Arrhythmias, Heart Blocks & MI',
          time: '20 min',
          weight: '35M High-Yield',
          accent: 'bg-[#006B63]',
          stripe: 'from-[#006B63] to-teal-400',
          pill: 'bg-teal-500/10 text-[#004D47] border-teal-300',
        },
        {
          subject: 'General Surgery',
          subtag: 'Trauma & ATLS',
          topic: 'Primary Survey, FAST & Burns',
          time: '25 min',
          weight: '35M High-Yield',
          accent: 'bg-[#B57B66]',
          stripe: 'from-[#B57B66] to-amber-400',
          pill: 'bg-amber-500/10 text-[#8C533F] border-amber-300',
        },
        {
          subject: 'Obstetrics & Gyn',
          subtag: 'Emergency Pearl',
          topic: 'Preeclampsia & MgSO4 Regimen',
          time: '15 min',
          weight: '30M High-Yield',
          accent: 'bg-[#9D4B66]',
          stripe: 'from-[#9D4B66] to-rose-400',
          pill: 'bg-rose-500/10 text-[#7A2C44] border-rose-300',
        },
      ].map((item) => (
        <motion.div
          key={item.topic}
          whileHover={{ x: 4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="group relative rounded-2xl border border-stone-200/90 bg-white/95 p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-stone-300 hover:shadow-[0_8px_20px_rgba(0,107,99,0.06)] overflow-hidden cursor-default"
        >
          {/* Subtle vibrant accent line on left */}
          <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${item.stripe}`} />

          <div className="flex items-start justify-between gap-2 pl-1.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className={`h-2 w-2 rounded-full ${item.accent} mt-1.5 shrink-0 ring-2 ring-stone-100`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900 truncate">{item.subject}</span>
                  <span className="text-[10px] font-mono text-stone-400">·</span>
                  <span className="text-[10px] font-mono text-stone-500 font-medium truncate">{item.subtag}</span>
                </div>
                <p className="text-[11.5px] text-stone-600 mt-0.5 truncate font-normal">{item.topic}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${item.pill}`}>
                {item.weight}
              </span>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.time}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Executive Readiness Score Module */}
    <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-stone-50/90 to-teal-50/20 p-4 space-y-2.5 shadow-2xs relative overflow-hidden">
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
          {/* Passing 150 mark notch */}
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

      <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-stone-200/60 font-mono">
        <span className="text-stone-500 font-medium">19 Subjects Synthesized</span>
        <span className="font-bold text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Passing Pace (Day 42)
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
        <header className="relative w-full max-w-6xl mx-auto flex items-center justify-between py-3 z-10">
          <div className="flex items-center gap-3">
            <OneShotMark size="sm" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-stone-900 font-['Outfit']">
                ONE SHOT <span className="text-[#006B63]">FMGE</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/70 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#006B63]" />
                300 Marks Blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium px-3 py-1.5 rounded-full border border-stone-200/70 bg-white/70 backdrop-blur-sm shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-[#006B63]" />
            <span className="hidden sm:inline">Offline &amp; Cloud Sync</span>
          </div>
        </header>

        {/* Main Hero Container */}
        <main className="relative w-full max-w-6xl mx-auto my-auto py-8 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center z-10">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100/90 border border-stone-200/80 text-xs font-medium text-stone-600">
                <Sparkles className="h-3 w-3 text-[#006B63]" />
                <span>Deterministic FMGE Preparation</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-['Newsreader',_serif] font-normal text-stone-900 tracking-[-0.025em] leading-[1.12]">
                Master high-yield topics in{' '}
                <span className="bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#0284C7] bg-clip-text text-transparent font-semibold">one shot</span>.
              </h1>

              <p className="text-base sm:text-[16px] text-stone-500 max-w-xl font-normal leading-relaxed">
                Know what to study. Practice what matters. Fix what you get wrong. A clean, closed-loop clinical intelligence platform designed for first-attempt FMGE success.
              </p>
            </div>

            {/* 3 Value Propositions with Dynamic Accents & Motion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <motion.div
                whileHover={{ y: -6, scale: 1.025 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden group cursor-default transition-all duration-200 hover:border-teal-300 hover:shadow-[0_12px_28px_rgba(0,107,99,0.08)]"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-400" />
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 shadow-2xs group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 tracking-tight">19 Subjects</span>
                </div>
                <p className="text-xs text-stone-500 mt-2 leading-snug">NBE weighted blueprint &amp; high-yield clinical pearls</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -6, scale: 1.025 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden group cursor-default transition-all duration-200 hover:border-amber-300 hover:shadow-[0_12px_28px_rgba(181,123,102,0.08)]"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 shadow-2xs group-hover:scale-110 transition-transform">
                    <Target className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 tracking-tight">Adaptive Priority</span>
                </div>
                <p className="text-xs text-stone-500 mt-2 leading-snug">Dynamic 0–100 mastery tracking &amp; calibrated index</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -6, scale: 1.025 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden group cursor-default transition-all duration-200 hover:border-indigo-300 hover:shadow-[0_12px_28px_rgba(99,102,241,0.08)]"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400" />
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 shadow-2xs group-hover:scale-110 transition-transform">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-stone-900 tracking-tight">Closed-Loop</span>
                </div>
                <p className="text-xs text-stone-500 mt-2 leading-snug">Error Vault remediation &amp; spaced repetition recall</p>
              </motion.div>
            </div>

            {/* Vibrant Dynamic CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-300" />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    clearMessages();
                    setMode('signup');
                  }}
                  className="relative rounded-full bg-gradient-to-r from-[#006B63] via-[#0D9488] to-[#059669] text-white px-8 py-3.5 text-sm font-bold tracking-tight shadow-[0_8px_20px_rgba(0,107,99,0.3)] transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  clearMessages();
                  setMode('signin');
                }}
                className="rounded-full border border-stone-200/90 bg-white/90 hover:bg-white hover:border-stone-300 text-stone-800 px-7 py-3.5 text-sm font-semibold tracking-tight transition-all flex items-center justify-center cursor-pointer shadow-xs focus:outline-none"
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
                className="group inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-full border border-stone-200/90 bg-white/80 hover:bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 transition-all cursor-pointer shadow-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <PlayCircle className="h-4 w-4 text-[#006B63]" />
                <span>Continue in Local Practice Mode (Instant Access · No Sign-in)</span>
                <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-800 group-hover:translate-x-1 transition-all" />
              </motion.button>
            </div>
          </div>

          {/* Right Column: Dynamic Luxury Telemetry Card */}
          <div className="hidden lg:block lg:col-span-5 relative">
            {/* Ambient card backlight glow */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/15 via-emerald-500/10 to-amber-500/15 rounded-[36px] blur-2xl opacity-70 pointer-events-none" />

            {/* Floating High-Yield Marks Badge (Top-Right) */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-teal-200 shadow-[0_8px_24px_rgba(0,107,99,0.12)] text-[11px] font-bold text-teal-900 backdrop-blur-md z-20"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>+38 Marks Predicted</span>
            </motion.div>

            {/* Floating Retention Badge (Bottom-Left) */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-3 -left-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-200 shadow-[0_8px_24px_rgba(16,185,129,0.12)] text-[11px] font-bold text-emerald-900 backdrop-blur-md z-20"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>99.2% Retention Track</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-3xl border border-stone-200/90 bg-white/95 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,107,99,0.06)] backdrop-blur-xl relative z-10"
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
            <div className="inline-flex mb-3">
              <OneShotMark size="md" />
            </div>
            <h1 className="text-2xl font-normal font-['Newsreader',_serif] tracking-tight text-stone-900">
              {mode === 'signin' && 'Sign in to ONE SHOT'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset password'}
            </h1>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
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
