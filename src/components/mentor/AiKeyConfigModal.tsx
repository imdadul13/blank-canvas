import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

interface AiKeyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConfigured?: () => void;
}

export interface AiStatusResponse {
  configured: boolean;
  status: 'ready' | 'active' | 'missing_key' | 'rate_limited' | 'invalid_key' | 'error';
  keyPreview?: string;
  activeModel?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}

export const AiKeyConfigModal: React.FC<AiKeyConfigModalProps> = ({
  isOpen,
  onClose,
  onKeyConfigured,
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'render'>('instant');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<AiStatusResponse | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchStatus = async (probe = false) => {
    if (probe) setIsProbing(true);
    try {
      const res = await fetch(`/api/ai/status${probe ? '?probe=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch {
      setStatusData({
        configured: false,
        status: 'error',
        message: 'Could not connect to backend status service.',
      });
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setVerifyError(null);
      setVerifySuccess(null);
      fetchStatus(false);
    }
  }, [isOpen]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || apiKeyInput.trim().length < 10) {
      setVerifyError('Please enter a valid Gemini API key.');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);

    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifySuccess('Gemini API connected & verified successfully!');
        setApiKeyInput('');
        await fetchStatus(true);
        if (onKeyConfigured) onKeyConfigured();
      } else {
        setVerifyError(data.error || 'Verification failed. Please ensure the key is active at ai.google.dev.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to communicate with server.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyEnvKey = () => {
    navigator.clipboard.writeText('GEMINI_API_KEY');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-teal-500/20 overflow-hidden font-['Plus_Jakarta_Sans'] my-8"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800/60 border-b border-stone-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 h-9 w-9 rounded-2xl bg-white/80 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center shadow-xs border border-stone-200/80 dark:border-slate-700 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#006B63] to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-900/15 shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold font-['Outfit'] text-slate-900 dark:text-white tracking-tight">
                  Gemini AI Engine Settings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect your Google Gemini API key for live medical reasoning on Render & Web.
                </p>
              </div>
            </div>

            {/* Live Status Pill */}
            <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-stone-200/90 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                {statusData?.configured ? (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Live AI Active
                    </span>
                    {statusData.keyPreview && (
                      <span className="text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800">
                        {statusData.keyPreview}
                      </span>
                    )}
                    {statusData.latencyMs !== undefined && (
                      <span className="text-[10.5px] text-slate-400">
                        ({statusData.latencyMs}ms)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      API Key Missing on Server
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      (Offline fallback active)
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchStatus(true)}
                disabled={isProbing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-stone-200/60 dark:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isProbing ? 'animate-spin text-teal-600' : ''}`} />
                <span>{isProbing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50 px-6 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('instant')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'instant'
                  ? 'border-[#006B63] text-[#006B63] dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Instant Connect (In-App)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('render')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'render'
                  ? 'border-[#006B63] text-[#006B63] dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>Render Dashboard Setup</span>
            </button>
          </div>

          {/* Tab 1: Instant In-App Connect */}
          {activeTab === 'instant' && (
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-900 dark:text-teal-200 text-xs leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  Instant Live Activation
                </p>
                Paste your Gemini API key below. The server will immediately verify it with Google and activate live AI across all consultations without requiring a server reboot.
              </div>

              <form onSubmit={handleSaveKey} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Google Gemini API Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="AIzaSy... or AQ.Ab8..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-stone-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B63] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {verifyError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {verifySuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{verifySuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <a
                    href="https://ai.google.dev/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B63] dark:text-teal-400 hover:underline"
                  >
                    <span>Get a free Gemini API key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="submit"
                    disabled={isVerifying || !apiKeyInput.trim()}
                    className="px-4 py-2 rounded-2xl bg-[#006B63] hover:bg-[#00554E] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying with Google...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Verify & Connect</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Permanent Render Environment Setup */}
          {activeTab === 'render' && (
            <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                To ensure your Gemini API key permanently persists across future Render redeployments and container restarts:
              </p>

              <ol className="space-y-3 pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#006B63] dark:text-teal-300 font-bold text-[11px] items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Open your{' '}
                    <a
                      href="https://dashboard.render.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#006B63] dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                    >
                      Render Dashboard <ExternalLink className="h-2.5 w-2.5" />
                    </a>{' '}
                    and select your web service (e.g.{' '}
                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                      oneshot-fmge-web
                    </code>
                    ).
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#006B63] dark:text-teal-300 font-bold text-[11px] items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    In the left sidebar, click <strong>Environment</strong> $\rightarrow$ click{' '}
                    <strong>Add Environment Variable</strong>.
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#006B63] dark:text-teal-300 font-bold text-[11px] items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="space-y-1.5 w-full">
                    <div>Set the key and value:</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-stone-200 dark:border-slate-700">
                        Key: GEMINI_API_KEY
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyEnvKey}
                        className="text-[11px] text-teal-600 hover:text-teal-700 flex items-center gap-1 font-semibold"
                      >
                        {copiedKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Value: your Google Gemini API key from{' '}
                      <a
                        href="https://ai.google.dev/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 underline"
                      >
                        ai.google.dev
                      </a>
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[#006B63] dark:text-teal-300 font-bold text-[11px] items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    Click <strong>Save Changes</strong>. Render will automatically redeploy your app with live AI enabled!
                  </div>
                </li>
              </ol>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
