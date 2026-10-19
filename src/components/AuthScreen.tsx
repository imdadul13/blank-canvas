import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveAuthError } from '../utils/authErrors';
import OneShotLogo from './OneShotLogo';
import { Button, Card, Divider, Pill } from './ui/Button';
import { IconTile } from './ui/surface';

type AuthMode = 'welcome' | 'signin' | 'signup' | 'forgot';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'size-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

function AuthField({
  id,
  label,
  icon: Icon,
  type = 'text',
  value,
  placeholder,
  autoComplete,
  required,
  trailing,
  hideLabel = false,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  type?: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  required?: boolean;
  trailing?: React.ReactNode;
  hideLabel?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="auth-field block space-y-2">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 't-caption block font-semibold text-[var(--color-ink-2)]'}>{label}</label>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-3)]" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="auth-input h-12 w-full rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface-sunken)] pl-11 pr-4 text-sm font-medium text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-4)] focus:border-accent focus:bg-[var(--color-surface)] focus:ring-4 focus:ring-[var(--accent-lift)]"
        />
        {trailing}
      </span>
    </div>
  );
}

const AuthBackdrop = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <motion.div
      className="auth-aurora auth-aurora-primary"
      animate={{ scale: [1, 1.08, 1], x: [0, 26, 0], y: [0, -18, 0] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="auth-aurora auth-aurora-secondary"
      animate={{ scale: [1.05, 0.96, 1.05], x: [0, -20, 0], y: [0, 20, 0] }}
      transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
    />
    <div className="auth-grid-pattern absolute inset-0" />
  </div>
);

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
  const [isDark, setIsDark] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const clearMessages = () => {
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
  };

  const changeMode = (nextMode: AuthMode) => {
    clearMessages();
    setMode(nextMode);
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    const override = nextDark ? 'night' : 'afternoon';
    setIsDark(nextDark);
    localStorage.setItem('fmge_circadian_override', override);
    window.dispatchEvent(new CustomEvent('circadian-theme-change', { detail: override }));
  };

  const handleCopyDomain = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(currentHost);
    setCopiedDomain(true);
    window.setTimeout(() => setCopiedDomain(false), 2500);
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

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
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

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setSuccessMsg('Password reset link sent. Check your inbox for the next step.');
    } catch (err: any) {
      setIsLoading(false);
      const { code, message } = resolveAuthError(err, 'forgot');
      setErrorCode(code);
      setErrorMsg(message);
    }
  };

  const passwordControl = (
    <Button
      variant="ghost"
      size="sm"
      icon
      onClick={() => setShowPassword((visible) => !visible)}
      className="absolute right-1.5 top-1/2 -translate-y-1/2"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );

  const titles: Record<Exclude<AuthMode, 'welcome'>, { title: string; description: string }> = {
    signin: {
      title: 'Welcome back, Doctor',
      description: 'Sign in to continue your study plan and synced progress.',
    },
    signup: {
      title: 'Build your FMGE plan',
      description: 'Create an account to keep your targets, reviews, and progress in sync.',
    },
    forgot: {
      title: 'Reset your password',
      description: 'We will send a secure recovery link to your account email.',
    },
  };

  return (
    <div data-accent="home" className="auth-screen relative min-h-screen overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <AuthBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-[max(1rem,var(--safe-b))] pt-[max(1rem,var(--safe-t))] sm:px-6 lg:px-8">
        <header className="flex min-h-12 items-center justify-between gap-3">
          <OneShotLogo variant="horizontal" showTagline taglineText="300 Marks Blueprint" />
          <div className="flex items-center gap-2">
            <Pill tone="pass" className="hidden sm:inline-flex">
              <span className="size-1.5 rounded-full bg-[var(--color-pass-ink)]" />
              Local mode ready
            </Pill>
            <Button
              variant="secondary"
              size="sm"
              icon
              onClick={toggleTheme}
              aria-label={isDark ? 'Use light appearance' : 'Use dark appearance'}
              title={isDark ? 'Use light appearance' : 'Use dark appearance'}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.72fr)] lg:gap-14 lg:py-12">
          <section className="mx-auto w-full max-w-2xl lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <Pill tone="info">
                <ShieldCheck className="size-3.5" />
                Purpose-built for the 300-mark FMGE
              </Pill>

              <div className="space-y-4">
                <h1 className="t-display max-w-[13ch] text-[var(--color-ink)]">
                  Study the signal. Skip the noise.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--color-ink-2)] sm:text-lg">
                  A focused clinical workspace that turns the NBE blueprint, your question history, and spaced revision into one clear daily plan.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Target, value: '300', label: 'marks mapped', color: 'var(--color-ios-blue)' },
                  { icon: BookOpenCheck, value: '19', label: 'subjects weighted', color: 'var(--color-study-ink)' },
                  { icon: Sparkles, value: '1 loop', label: 'learn · test · fix', color: 'var(--color-knowledge-ink)' },
                ].map((item) => (
                  <Card key={item.label} className="flex items-center gap-3 p-3.5">
                    <IconTile icon={item.icon} size={38} color={item.color} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--color-ink)]">{item.value}</div>
                      <div className="truncate text-xs text-[var(--color-ink-3)]">{item.label}</div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="auth-preview hidden overflow-hidden p-5 sm:block">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="t-eyebrow text-accent">Today’s high-yield route</div>
                    <div className="mt-1.5 text-base font-bold">Cardiology · Acute MI and arrhythmias</div>
                    <div className="mt-1 text-sm text-[var(--color-ink-2)]">30 focused minutes · 10 recall questions · 1 error review</div>
                  </div>
                  <Pill tone="pass">
                    <Check className="size-3.5" />
                    On pace
                  </Pill>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {['Learn the pattern', 'Test the decision', 'Revisit the miss'].map((step, index) => (
                    <div key={step} className="rounded-2xl bg-[var(--color-surface-sunken)] p-3">
                      <div className="mb-2 flex size-6 items-center justify-center rounded-lg bg-accent-tint text-xs font-bold text-accent">
                        {index + 1}
                      </div>
                      <div className="text-xs font-semibold text-[var(--color-ink-2)]">{step}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mx-auto w-full max-w-md"
          >
            <Card raised className="auth-access-card overflow-hidden">
              <div className="p-5 sm:p-7">
                {mode === 'welcome' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Pill tone="accent">Start here</Pill>
                        <span className="text-xs font-medium text-[var(--color-ink-3)]">Free to begin</span>
                      </div>
                      <h2 className="t-title text-[var(--color-ink)]">Your next study session, ready in seconds.</h2>
                      <p className="text-sm leading-6 text-[var(--color-ink-2)]">Create a synced account or enter local practice mode without signing up.</p>
                    </div>

                    <div className="space-y-3">
                      <Button variant="primary" size="lg" block onClick={() => changeMode('signup')}>
                        Create free account
                        <ArrowRight className="size-4" />
                      </Button>
                      <Button variant="secondary" size="lg" block onClick={handleGoogleSignIn} disabled={isLoading}>
                        <GoogleIcon className="size-4" />
                        Continue with Google
                      </Button>
                      <Button variant="ghost" size="md" block onClick={() => changeMode('signin')}>
                        I already have an account
                      </Button>
                    </div>

                    <Divider />

                    <div className="rounded-2xl bg-[var(--color-surface-sunken)] p-4">
                      <div className="flex items-start gap-3">
                        <IconTile icon={ShieldCheck} size={36} color="var(--color-pass-ink)" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">Prefer to stay on this device?</div>
                          <p className="mt-1 text-xs leading-5 text-[var(--color-ink-3)]">Local practice keeps your session on this browser. You can create an account later.</p>
                          <Button variant="quiet" size="sm" className="-ml-3 mt-1" onClick={() => continueAsGuest('Dr. Aspirant')}>
                            Enter local practice
                            <ArrowRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <Button variant="ghost" size="sm" className="-ml-3" onClick={() => changeMode('welcome')}>
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>

                    <div className="space-y-2">
                      <h2 className="t-title text-[var(--color-ink)]">{titles[mode].title}</h2>
                      <p className="text-sm leading-6 text-[var(--color-ink-2)]">{titles[mode].description}</p>
                    </div>

                    {errorMsg && (
                      <div role="alert" className="auth-alert-fail rounded-2xl border p-3.5 text-sm text-[var(--color-fail-ink)]">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="mt-0.5 size-4 shrink-0" />
                          <span className="font-medium leading-5">{errorMsg}</span>
                        </div>
                        {errorCode === 'auth/unauthorized-domain' && (
                          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--color-surface)] p-2">
                            <code className="min-w-0 flex-1 truncate text-xs">{currentHost}</code>
                            <Button variant="secondary" size="sm" onClick={handleCopyDomain}>
                              {copiedDomain ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                              {copiedDomain ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {successMsg && (
                      <div role="status" className="auth-alert-pass flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm text-[var(--color-pass-ink)]">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                        <span className="font-medium leading-5">{successMsg}</span>
                      </div>
                    )}

                    {mode !== 'forgot' && (
                      <>
                        <Button variant="secondary" size="lg" block onClick={handleGoogleSignIn} disabled={isLoading}>
                          <GoogleIcon className="size-4" />
                          Continue with Google
                        </Button>
                        <div className="flex items-center gap-3">
                          <Divider />
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">or email</span>
                          <Divider />
                        </div>
                      </>
                    )}

                    {mode === 'signin' && (
                      <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <AuthField id="signin-email" label="Email address" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="doctor@example.com" autoComplete="email" required />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="t-caption font-semibold text-[var(--color-ink-2)]">Password</span>
                            <Button variant="quiet" size="sm" className="h-auto px-1 py-0" onClick={() => changeMode('forgot')}>Forgot password?</Button>
                          </div>
                          <AuthField id="signin-password" label="Password" icon={Lock} type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="current-password" required trailing={passwordControl} hideLabel />
                        </div>
                        <Button type="submit" variant="primary" size="lg" block disabled={isLoading}>
                          {isLoading ? <span className="auth-spinner" /> : <>Sign in <ArrowRight className="size-4" /></>}
                        </Button>
                      </form>
                    )}

                    {mode === 'signup' && (
                      <form onSubmit={handleEmailSignUp} className="space-y-4">
                        <AuthField id="signup-name" label="Doctor name" icon={User} value={displayName} onChange={setDisplayName} placeholder="Dr. Candidate" autoComplete="name" />
                        <AuthField id="signup-email" label="Email address" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="doctor@example.com" autoComplete="email" required />
                        <AuthField id="signup-password" label="Create password" icon={Lock} type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="At least 6 characters" autoComplete="new-password" required trailing={passwordControl} />
                        <Button type="submit" variant="primary" size="lg" block disabled={isLoading}>
                          {isLoading ? <span className="auth-spinner" /> : <>Create account <ArrowRight className="size-4" /></>}
                        </Button>
                      </form>
                    )}

                    {mode === 'forgot' && (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <AuthField id="reset-email" label="Account email" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="doctor@example.com" autoComplete="email" required />
                        <Button type="submit" variant="primary" size="lg" block disabled={isLoading}>
                          {isLoading ? <span className="auth-spinner" /> : 'Send reset link'}
                        </Button>
                      </form>
                    )}

                    <Divider />
                    <div className="text-center text-xs text-[var(--color-ink-3)]">
                      {mode === 'signin' && <>New candidate? <Button variant="quiet" size="sm" className="h-auto px-1 py-0" onClick={() => changeMode('signup')}>Create an account</Button></>}
                      {mode === 'signup' && <>Already registered? <Button variant="quiet" size="sm" className="h-auto px-1 py-0" onClick={() => changeMode('signin')}>Sign in</Button></>}
                      {mode === 'forgot' && <>Remembered it? <Button variant="quiet" size="sm" className="h-auto px-1 py-0" onClick={() => changeMode('signin')}>Back to sign in</Button></>}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.section>
        </main>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[var(--color-hairline)] py-4 text-center text-xs text-[var(--color-ink-3)] sm:flex-row sm:text-left">
          <span>ONE SHOT FMGE · Clinical intelligence for focused preparation</span>
          <span>No payment required to begin</span>
        </footer>
      </div>
    </div>
  );
};
