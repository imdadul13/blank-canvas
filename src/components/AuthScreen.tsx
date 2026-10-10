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
  Copy,
  Check,
  PlayCircle,
  BookOpen,
  Activity,
  Award,
  Stethoscope,
  Calendar,
  RotateCcw,
  ChevronRight,
  Heart,
  Flame,
  Zap,
  BarChart3,
  Layers,
  GraduationCap,
  Play,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveAuthError } from '../utils/authErrors';
import OneShotLogo from './OneShotLogo';
import { MedicalHeroVisual } from './MedicalHeroVisual';

/* ─── Google SVG ─── */
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'size-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

/* ─── Apple HIG Inset Input Style ─── */
const inputCls =
  'w-full h-12 rounded-2xl border border-black/[0.08] bg-[#F2F2F7] px-4 text-sm font-semibold text-[#1D1D1F] placeholder:text-[#8E8E93] focus:bg-white focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 transition-all shadow-inner';

/* ─── Apple Cupertino Ambient Mesh Background (Assorted Apple Hues: Blue, Purple, Rose, Amber, Green) ─── */
const AppleAmbientMesh: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
    {/* Apple Cobalt Blue Glow */}
    <motion.div
      animate={{
        scale: [1, 1.25, 1],
        x: [0, 40, 0],
        y: [0, -30, 0],
        opacity: [0.28, 0.48, 0.28],
      }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-36 right-1/4 h-[650px] w-[750px] rounded-full bg-gradient-to-br from-[#007AFF]/22 via-[#5AC8FA]/16 to-transparent blur-[140px]"
    />

    {/* Apple Royal Purple / Indigo Glow */}
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        x: [0, -35, 0],
        y: [0, 40, 0],
        opacity: [0.22, 0.40, 0.22],
      }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      className="absolute top-1/4 -left-36 h-[580px] w-[680px] rounded-full bg-gradient-to-tr from-[#5856D6]/18 via-[#AF52DE]/14 to-transparent blur-[140px]"
    />

    {/* Apple Emerald Green Glow */}
    <motion.div
      animate={{
        scale: [1, 1.18, 1],
        x: [0, 30, 0],
        y: [0, -35, 0],
        opacity: [0.18, 0.35, 0.18],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      className="absolute -bottom-36 right-10 h-[560px] w-[700px] rounded-full bg-gradient-to-tl from-[#34C759]/16 via-[#30D158]/10 to-transparent blur-[140px]"
    />

    {/* Floating Luminous Apple Motes */}
    {[
      { x: '10%', y: '20%', size: 4, delay: 0, duration: 7, color: 'bg-[#007AFF]/60 shadow-[0_0_12px_rgba(0,122,255,0.7)]' },
      { x: '25%', y: '65%', size: 3.5, delay: 1.5, duration: 8, color: 'bg-[#5856D6]/60 shadow-[0_0_12px_rgba(88,86,214,0.7)]' },
      { x: '48%', y: '14%', size: 5, delay: 0.8, duration: 9, color: 'bg-[#34C759]/60 shadow-[0_0_12px_rgba(52,199,89,0.7)]' },
      { x: '72%', y: '80%', size: 3.5, delay: 2, duration: 7.5, color: 'bg-[#FF9500]/60 shadow-[0_0_12px_rgba(255,149,0,0.7)]' },
      { x: '88%', y: '24%', size: 4, delay: 1, duration: 8.5, color: 'bg-[#FF2D55]/60 shadow-[0_0_12px_rgba(255,45,85,0.7)]' },
    ].map((p, i) => (
      <motion.div
        key={i}
        style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
        animate={{
          y: [0, -35, 0],
          opacity: [0.2, 0.75, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: p.duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: p.delay,
        }}
        className={`absolute rounded-full ${p.color} pointer-events-none`}
      />
    ))}

    {/* Subtle ECG Baseline across bottom */}
    <div className="absolute bottom-6 left-0 right-0 h-10 opacity-[0.06] overflow-hidden pointer-events-none">
      <svg viewBox="0 0 1200 40" className="w-full h-full stroke-[#007AFF] fill-none stroke-[2]" preserveAspectRatio="none">
        <path d="M 0 20 L 200 20 L 210 10 L 218 35 L 226 5 L 234 25 L 242 20 L 600 20 L 610 10 L 618 35 L 626 5 L 634 25 L 642 20 L 1000 20 L 1010 10 L 1018 35 L 1026 5 L 1034 25 L 1042 20 L 1200 20" />
      </svg>
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

  // Interactive MCQ preview inside Bento
  const [selectedOption, setSelectedOption] = useState<number | null>(2);

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
     1. WELCOME SCREEN (Apple Cupertino Flagship Bento & Keynote)
  ───────────────────────────────────────────────────────────── */
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans text-[#1D1D1F]">
        <AppleAmbientMesh />

        {/* ── Top Floating Glass Capsule Bar ── */}
        <header className="relative w-full max-w-7xl mx-auto flex items-center justify-between py-2 z-20">
          <OneShotLogo variant="horizontal" showTagline={true} taglineText="300 Marks Blueprint" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#1D1D1F] font-semibold px-4 py-2 rounded-full border border-black/[0.06] bg-white/90 backdrop-blur-md shadow-sm">
              <span className="size-2 rounded-full bg-[#34C759] animate-pulse" />
              <span>Offline &amp; Cloud Sync Active</span>
            </div>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setMode('signin');
              }}
              className="px-5 py-2 rounded-full bg-white hover:bg-[#F2F2F7] text-[#1D1D1F] border border-black/[0.08] text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* ── Center Stage: Keynote Hero Section ── */}
        <main className="relative w-full max-w-7xl mx-auto my-auto py-6 sm:py-10 z-10 space-y-10">
          {/* 1. Epic Apple Keynote Heading & Action Cluster */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            {/* Top Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/[0.06] shadow-sm text-xs font-bold text-[#1D1D1F]"
            >
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-[#007AFF] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#007AFF]" />
              </span>
              <ShieldCheck className="size-3.5 text-[#007AFF]" />
              <span>Deterministic FMGE Medical Intelligence · 300 Marks Blueprint</span>
            </motion.div>

            {/* Giant Apple Keynote Typography with Cupertino Gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-[68px] font-black text-[#1D1D1F] tracking-[-0.045em] leading-[1.02]"
            >
              Master high-yield topics in{' '}
              <span className="bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE] bg-clip-text text-transparent">
                one shot
              </span>
              <span className="text-[#007AFF]">.</span>
            </motion.h1>

            {/* Crisp Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#6E6E73] max-w-2xl mx-auto font-medium leading-relaxed tracking-[-0.01em]"
            >
              Know what to study. Practice what matters. Fix what you get wrong. A clean, closed-loop clinical intelligence platform designed for first-attempt FMGE success.
            </motion.p>

            {/* Call to Actions Cluster with Assorted Apple Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 pt-2"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  clearMessages();
                  setMode('signup');
                }}
                className="rounded-full bg-[#007AFF] hover:bg-[#0066D6] text-white px-8 py-4 text-sm font-bold tracking-tight shadow-[0_8px_25px_rgba(0,122,255,0.35)] hover:shadow-[0_12px_32px_rgba(0,122,255,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="size-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGuestEntry}
                className="rounded-full bg-white hover:bg-[#F2F2F7] border border-black/[0.08] text-[#1D1D1F] px-7 py-4 text-sm font-bold tracking-tight transition-all flex items-center gap-2.5 cursor-pointer shadow-sm"
              >
                <PlayCircle className="size-4 text-[#007AFF]" />
                <span>Start in Local Practice Mode</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                  Instant Access
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* 2. Apple Bento Showcase Grid (Assorted Cupertino Hues) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
            {/* Bento Tile 1 (Large 7 Cols): Today's Focus & Interactive Clinical Vignette */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="lg:col-span-7 rounded-[32px] bg-white border border-black/[0.06] p-6 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between"
            >
              {/* Header Cluster */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-[#34C759]/12 border border-[#34C759]/25 text-[11px] font-bold text-[#28A745] flex items-center gap-1.5 shadow-2xs">
                    <span className="size-1.5 rounded-full bg-[#34C759] animate-pulse" />
                    TODAY&apos;S CLINICAL FOCUS
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/25 text-[11px] font-bold text-[#007AFF] shadow-2xs">
                    GENERAL MEDICINE
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700 bg-[#F2F2F7] border border-black/[0.06] px-3 py-1 rounded-full">
                  72 bpm Sinus Rhythm
                </span>
              </div>

              {/* Clinical Topic & 3D Centerpiece */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center my-4">
                <div className="sm:col-span-7 space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight leading-snug">
                    Cardiology — <span className="text-[#007AFF]">Acute MI &amp; Arrhythmias</span>
                  </h3>
                  <p className="text-xs text-[#6E6E73] font-medium leading-relaxed">
                    Master STEMI localization, AV blocks, and emergency antiarrhythmic drug regimens. High-frequency NBE exam core.
                  </p>

                  {/* Interactive MCQ Vignette snippet */}
                  <div className="pt-2 space-y-2">
                    <p className="text-[11px] font-bold text-[#1D1D1F] flex items-center gap-1.5">
                      <Target className="size-3.5 text-[#007AFF]" />
                      <span>Exam Vignette: ST elevation in II, III, aVF artery?</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['LAD (12%)', 'LCx (4%)', 'RCA (84% Correct)'].map((opt, i) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedOption(i)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            selectedOption === i
                              ? 'bg-[#007AFF] text-white shadow-xs'
                              : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3D Heart Centerpiece */}
                <div className="sm:col-span-5 h-[160px] rounded-2xl bg-gradient-to-b from-[#007AFF]/[0.05] via-white to-[#F2F2F7] border border-black/[0.05] relative overflow-hidden flex items-center justify-center shadow-inner">
                  <motion.div
                    animate={{ y: [-3, 3, -3], scale: [1, 1.02, 1] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="size-full flex items-center justify-center p-2"
                  >
                    <MedicalHeroVisual
                      subjectId="medicine"
                      subjectName="General Medicine"
                      subjectColor="#007AFF"
                      topicName="Cardiology - ECGs"
                      className="size-full"
                      showTelemetryTag={false}
                    />
                  </motion.div>
                  <div className="absolute bottom-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 border border-black/[0.08] shadow-2xs">
                    <span className="size-1.5 rounded-full bg-[#34C759] animate-pulse" />
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#1D1D1F]">
                      Conduction Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Metrics Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/[0.05]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F2F2F7] text-xs font-bold text-[#1D1D1F]">
                    <Calendar className="size-3 text-[#8E8E93]" />
                    35 marks
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F2F2F7] text-xs font-bold text-[#1D1D1F]">
                    <Clock className="size-3 text-[#8E8E93]" />
                    30 min
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200/80 text-xs font-bold text-[#FF2D55]">
                    <Activity className="size-3 text-[#FF2D55] animate-pulse" />
                    High-yield Core
                  </span>
                </div>
                <span className="text-xs font-bold text-[#007AFF] flex items-center gap-1 cursor-pointer hover:underline">
                  <span>Start Module</span>
                  <ChevronRight className="size-3.5" />
                </span>
              </div>
            </motion.div>

            {/* Bento Tile 2 (5 Cols): Passing Gap Analyzer & Readiness Meter */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="lg:col-span-5 rounded-[32px] bg-white border border-black/[0.06] p-6 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
                  <span className="px-3 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-bold">
                    PREDICTOR ENGINE
                  </span>
                  <span className="text-[11px] font-bold text-[#34C759] flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-[#34C759]" />
                    Passing Pace
                  </span>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
                    FMGE Readiness Index
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#1D1D1F]">
                      182
                    </span>
                    <span className="text-lg font-bold text-[#8E8E93]">/ 300</span>
                    <span className="ml-auto px-2.5 py-1 rounded-full bg-emerald-50 text-[#34C759] border border-emerald-200 text-xs font-bold">
                      +32 Safety Buffer
                    </span>
                  </div>
                </div>

                {/* Progress bar with Apple Blue to Emerald */}
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full bg-[#E5E5EA] rounded-full overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-[#FF3B30] z-10" style={{ left: '50%' }} title="Pass Threshold: 150" />
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '68%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#34C759] rounded-full shadow-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6E6E73] font-medium">
                    <span className="text-[#FF3B30] font-bold">150 Pass Line</span>
                    <span className="text-[#007AFF] font-bold">Target 200+</span>
                  </div>
                </div>
              </div>

              {/* Sub-Metric Badges */}
              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-black/[0.05]">
                <div className="p-3 rounded-2xl bg-[#F2F2F7] border border-black/[0.04]">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93] block">Paper 1 (Pre/Para)</span>
                  <span className="text-sm font-black text-[#1D1D1F]">94 / 150 (63%)</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#F2F2F7] border border-black/[0.04]">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93] block">Paper 2 (Clinical)</span>
                  <span className="text-sm font-black text-[#1D1D1F]">88 / 150 (59%)</span>
                </div>
              </div>
            </motion.div>

            {/* Bento Tile 3 (4 Cols): 19 Subjects NBE Blueprint Matrix (Apple Cobalt Blue) */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="lg:col-span-4 rounded-[32px] bg-white border border-black/[0.06] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.04)] space-y-3"
            >
              <div className="size-10 rounded-2xl bg-[#007AFF]/12 text-[#007AFF] flex items-center justify-center shadow-2xs">
                <BookOpen className="size-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] block">NBE Blueprint Matrix</span>
                <h4 className="text-lg font-black text-[#1D1D1F]">19 Subjects Fully Mapped</h4>
              </div>
              <p className="text-xs text-[#6E6E73] font-medium leading-relaxed">
                Medicine, Surgery, OBG, PSM, Pathology, and all clinical &amp; pre-clinical disciplines weighted by marks.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Med (35m)', 'Surg (30m)', 'OBG (30m)', 'PSM (30m)', 'Path (25m)', 'Pharm (20m)'].map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-xl bg-[#F2F2F7] text-[10.5px] font-bold text-[#1D1D1F]">
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Bento Tile 4 (4 Cols): Closed-Loop Error Vault (Apple Emerald) */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="lg:col-span-4 rounded-[32px] bg-white border border-black/[0.06] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.04)] space-y-3"
            >
              <div className="size-10 rounded-2xl bg-[#34C759]/12 text-[#34C759] flex items-center justify-center shadow-2xs">
                <RotateCcw className="size-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#34C759] block">Closed-Loop Recall</span>
                <h4 className="text-lg font-black text-[#1D1D1F]">Turn mistakes into recall</h4>
              </div>
              <p className="text-xs text-[#6E6E73] font-medium leading-relaxed">
                Missed questions can be revisited on a spaced schedule (1d → 3d → 7d → 21d) to strengthen recall over time.
              </p>
              <div className="p-3 rounded-2xl bg-[#34C759]/8 border border-[#34C759]/20 flex items-center justify-between text-xs">
                <span className="font-bold text-[#1D1D1F]">Remediation Rate</span>
                <span className="font-mono font-bold text-[#28A745]">Spaced review</span>
              </div>
            </motion.div>

            {/* Bento Tile 5 (4 Cols): Adaptive Daily Rhythm (Apple Orange) */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="lg:col-span-4 rounded-[32px] bg-white border border-black/[0.06] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.04)] space-y-3"
            >
              <div className="size-10 rounded-2xl bg-[#FF9500]/12 text-[#FF9500] flex items-center justify-center shadow-2xs">
                <Flame className="size-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF9500] block">Adaptive Daily Missions</span>
                <h4 className="text-lg font-black text-[#1D1D1F]">Daily Study Rhythm</h4>
              </div>
              <p className="text-xs text-[#6E6E73] font-medium leading-relaxed">
                Dynamic 0–100 mastery scoring updates every day based on your weak chapters and exam countdown.
              </p>
              <div className="p-3 rounded-2xl bg-[#FF9500]/8 border border-[#FF9500]/20 flex items-center justify-between text-xs">
                <span className="font-bold text-[#1D1D1F]">Daily Milestone Pacing</span>
                <span className="font-mono font-bold text-[#FF9500]">6–8 hrs / day</span>
              </div>
            </motion.div>
          </div>
        </main>

        {/* ── Signature Cupertino Quote Footer ── */}
        <footer className="relative w-full max-w-7xl mx-auto py-3 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/[0.04] text-[11px] text-[#8E8E93] font-medium mt-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-black/[0.05] shadow-xs">
            <span className="size-2 rounded-full bg-[#007AFF] animate-ping" />
            <span className="font-semibold text-[#1D1D1F]">&ldquo;Study hard today. Heal lives tomorrow.&rdquo;</span>
          </div>
          <span>ONE SHOT FMGE · Clinical Intelligence Platform</span>
          <span className="font-mono text-[10.5px]">NBE Screening Standard</span>
        </footer>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. AUTH FORMS (Sign In, Sign Up, Forgot Password)
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-4 relative font-sans text-[#1D1D1F]">
      <AppleAmbientMesh />

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Top Back Action */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode('welcome');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Back to Overview</span>
          </button>
          <span className="text-xs text-[#8E8E93] font-mono tracking-wider">ONE SHOT FMGE</span>
        </div>

        {/* Main Auth Card — Apple Studio Card */}
        <div className="rounded-[32px] border border-black/[0.06] bg-white p-7 sm:p-9 shadow-[0_24px_70px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex mb-3.5">
              <OneShotLogo variant="icon" size="lg" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#1D1D1F]">
              {mode === 'signin' && 'Sign in to ONE SHOT'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset password'}
            </h1>
            <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed font-medium">
              {mode === 'signin' && 'Welcome back, Doctor. Pick up your high-yield FMGE plan.'}
              {mode === 'signup' && 'Set up your personalized FMGE target and daily rhythm.'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-semibold leading-relaxed">{errorMsg}</div>
              </div>
              {errorCode === 'auth/unauthorized-domain' && (
                <div className="pt-2 border-t border-rose-200 flex items-center justify-between bg-white/90 p-2 rounded-xl">
                  <span className="font-mono text-[11px] truncate text-rose-900 max-w-[200px]">{currentHost}</span>
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
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-800">
              <CheckCircle2 className="size-4 text-[#34C759] shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Google Sign In Option */}
          {mode !== 'forgot' && (
            <div className="space-y-3 mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 rounded-full border border-black/[0.08] bg-white hover:bg-[#F2F2F7] active:scale-[0.985] px-4 py-3 text-xs font-bold text-[#1D1D1F] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon className="size-4" />
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-black/[0.06]" />
                <span className="absolute bg-white px-3 text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                  or with email
                </span>
              </div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8E8E93]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    autoComplete="email"
                    className={`${inputCls} pl-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1D1D1F]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('forgot');
                    }}
                    className="text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8E8E93]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`${inputCls} pl-10 pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1D1D1F] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-sm tracking-tight shadow-[0_4px_16px_rgba(0,122,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.985] mt-2"
              >
                {isLoading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">Doctor Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8E8E93]" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. Candidate"
                    autoComplete="name"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8E8E93]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    autoComplete="email"
                    className={`${inputCls} pl-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8E8E93]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className={`${inputCls} pl-10 pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1D1D1F] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-sm tracking-tight shadow-[0_4px_16px_rgba(0,122,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.985] mt-2"
              >
                {isLoading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">Your Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8E8E93]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    autoComplete="email"
                    className={`${inputCls} pl-10`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-sm tracking-tight shadow-[0_4px_16px_rgba(0,122,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.985] mt-2"
              >
                {isLoading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}

          {/* Switch mode links */}
          <div className="mt-6 pt-5 border-t border-black/[0.06] text-center text-xs">
            {mode === 'signin' && (
              <p className="text-[#6E6E73]">
                New candidate?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signup');
                  }}
                  className="font-bold text-[#007AFF] hover:underline cursor-pointer"
                >
                  Create your plan
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-[#6E6E73]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="font-bold text-[#007AFF] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p className="text-[#6E6E73]">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signin');
                  }}
                  className="font-bold text-[#007AFF] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
