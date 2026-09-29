import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Modal, ModalBody } from '../ui/Modal';
import { Button, Pill } from '../ui/Button';

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

type Tab = 'instant' | 'render';

const TABS: { id: Tab; label: string; Icon: typeof Zap }[] = [
  { id: 'instant', label: 'Instant Connect', Icon: Zap },
  { id: 'render', label: 'Render Setup', Icon: Server },
];

/** The numbered marker used by the Render walkthrough. */
function Step({ n }: { n: number }) {
  return (
    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-tint text-[11px] font-bold text-accent">
      {n}
    </span>
  );
}

/** A short mono token the user has to copy verbatim. */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-[var(--color-surface-sunken)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-ink)]">
      {children}
    </code>
  );
}

export const AiKeyConfigModal: React.FC<AiKeyConfigModalProps> = ({
  isOpen,
  onClose,
  onKeyConfigured,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('instant');
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
        setStatusData(await res.json());
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
        setVerifySuccess('Gemini API connected and verified.');
        setApiKeyInput('');
        await fetchStatus(true);
        onKeyConfigured?.();
      } else {
        setVerifyError(data.error || 'Verification failed. Make sure the key is active at ai.google.dev.');
      }
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to reach the server.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyEnvKey = () => {
    navigator.clipboard.writeText('GEMINI_API_KEY');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const live = Boolean(statusData?.configured);

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => !next && onClose()}
      title="Gemini AI Engine"
      description="Connect your API key for live medical reasoning"
      size="lg"
      header={
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-e3">
            <Key className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h2 className="t-title-sm truncate">Gemini AI Engine</h2>
            <p className="t-label mt-0.5 truncate">Connect your API key for live medical reasoning</p>
          </div>
        </div>
      }
    >
      {/* ── Live status ── */}
      <div className="hairline-b flex items-center justify-between gap-3 bg-[var(--color-surface-row)] px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {live ? (
            <>
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-pass)] opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--color-pass)]" />
              </span>
              <span className="t-label font-semibold text-[var(--color-pass-ink)]">Live AI active</span>
              {statusData?.keyPreview && (
                <span className="truncate font-mono text-[11px] text-[var(--color-ink-3)]">
                  {statusData.keyPreview}
                </span>
              )}
              {statusData?.latencyMs !== undefined && (
                <span className="t-num-xxs shrink-0 text-[var(--color-ink-3)]">{statusData.latencyMs}ms</span>
              )}
            </>
          ) : (
            <>
              <AlertTriangle className="size-4 shrink-0 text-[var(--color-warn)]" />
              <span className="t-label font-semibold text-[var(--color-warn-ink)]">Key missing</span>
              <span className="t-caption hidden sm:inline">Offline fallback active</span>
            </>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={() => fetchStatus(true)} disabled={isProbing}>
          <RefreshCw className={`size-3.5 ${isProbing ? 'animate-spin' : ''}`} />
          {isProbing ? 'Testing' : 'Test'}
        </Button>
      </div>

      {/* ── Segmented tabs ── */}
      <div className="flex shrink-0 items-center gap-1 px-5 py-3">
        <div className="flex w-full gap-1 rounded-2xl bg-[var(--color-surface-muted)] p-1">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-pressed={active}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all ${
                  active
                    ? 'bg-white text-accent shadow-e1'
                    : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ModalBody className="space-y-4">
        {activeTab === 'instant' ? (
          <>
            <div className="flex gap-3 rounded-2xl border border-accent/15 bg-accent-wash p-3.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              <div className="min-w-0 space-y-1">
                <p className="text-[13px] font-semibold text-accent">Instant live activation</p>
                <p className="t-body">
                  Paste your Gemini API key below. The server verifies it with Google and activates
                  live AI across every consultation — no redeploy required.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <div>
                <label htmlFor="gemini-key" className="t-label mb-1.5 block font-semibold">
                  Google Gemini API key
                </label>
                <div className="relative">
                  <Key className="pointer-events-none absolute inset-y-0 left-3.5 my-auto size-4 text-[var(--color-ink-3)]" />
                  <input
                    id="gemini-key"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="AIzaSy…"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[var(--color-hairline-strong)] bg-white pl-10 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {verifyError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-2xl border border-[var(--color-fail)]/20 bg-[var(--color-fail-wash)] p-3.5 text-[13px] text-[var(--color-fail-ink)]"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccess && (
                <div
                  role="status"
                  className="flex items-center gap-2.5 rounded-2xl border border-[var(--color-pass)]/20 bg-[var(--color-pass-wash)] p-3.5 text-[13px] font-medium text-[var(--color-pass-ink)]"
                >
                  <CheckCircle2 className="size-4 shrink-0" />
                  {verifySuccess}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <a
                  href="https://ai.google.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="hit-expand-x inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-accent hover:underline"
                >
                  Get a free Gemini key
                  <ExternalLink className="size-3" />
                </a>
                <Button type="submit" variant="primary" disabled={isVerifying || !apiKeyInput.trim()}>
                  {isVerifying ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Verify &amp; connect
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <p className="t-body">
              To make the key survive future Render redeploys and container restarts:
            </p>

            <ol className="space-y-3.5">
              {[
                <>
                  Open your{' '}
                  <a
                    href="https://dashboard.render.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-accent hover:underline"
                  >
                    Render Dashboard <ExternalLink className="inline size-3" />
                  </a>{' '}
                  and select your web service (e.g. <Code>oneshot-fmge-web</Code>).
                </>,
                <>
                  In the sidebar click <strong className="font-semibold">Environment</strong> →{' '}
                  <strong className="font-semibold">Add Environment Variable</strong>.
                </>,
                <div key="c" className="space-y-2">
                  <p>Set the key and value:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="neutral" className="font-mono">
                      GEMINI_API_KEY
                    </Pill>
                    <Button size="sm" variant="quiet" onClick={handleCopyEnvKey}>
                      {copiedKey ? <Check className="size-3" /> : <Copy className="size-3" />}
                      {copiedKey ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="t-caption">
                    Value: your Gemini API key from{' '}
                    <a
                      href="https://ai.google.dev/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-accent hover:underline"
                    >
                      ai.google.dev
                    </a>
                  </p>
                </div>,
                <>
                  Click <strong className="font-semibold">Save Changes</strong>. Render redeploys with
                  live AI enabled.
                </>,
              ].map((node, i) => (
                <li key={i} className="flex gap-3">
                  <Step n={i + 1} />
                  <div className="t-body min-w-0 flex-1 pt-px">{node}</div>
                </li>
              ))}
            </ol>

            <div className="flex justify-end border-t border-[var(--color-hairline)] pt-4">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};
