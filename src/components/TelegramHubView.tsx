import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Bookmark,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Play,
  X,
  Sparkles,
  Layers,
  Activity,
  ZoomIn,
  Terminal,
  FileText,
  AlertTriangle,
  Lightbulb,
  Bell,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Lock,
  Database,
  Cloud,
  Check,
  Plus,
  HelpCircle,
  Cpu,
  QrCode,
  Smartphone,
  CheckCheck,
  Brain,
} from "lucide-react";
import confetti from "canvas-confetti";
import { enrichClinicalQuestion } from "../utils/clinicalDistractorHelper";
import {
  TelegramMCQ,
  DailyTask,
  MedicalPearl,
  ErrorNotebookItem,
} from "../types";
import { NewMcqAttemptInput } from "../utils/performanceEngine";
import { FMGE_SUBJECTS } from "../data/fmgeSubjects";
import {
  normalizeTelegramPhoneNumber,
  mapTelegramAuthError,
} from "../utils/phoneValidation";

interface TelegramHubViewProps {
  questions?: TelegramMCQ[];
  channels?: any[];
  announcements?: any[];
  rawMessages?: any[];
  canonicalQuestions?: any[];
  questionSources?: any[];
  autoSaveHighYield?: boolean;
  onToggleAutoSaveHighYield?: () => void;
  onUpdateQuestion?: (questionId: string, updates: Partial<TelegramMCQ>) => void;
  onRecordAttempt?: (input: NewMcqAttemptInput) => void;
  onAddQuestions?: (newQuestions: TelegramMCQ[]) => void;
  onAddAnnouncements?: (announcements: any[]) => void;
  onUpdateAnnouncement?: (announcementId: string, updates: any) => void;
  onAddChannel?: (channel: any) => void;
  onDeleteChannel?: (channelId: string) => void;
  onAddToErrorNotebook?: (item: Omit<ErrorNotebookItem, "id" | "dateAdded">) => void;
  onSaveAsPearl?: (pearl: Omit<MedicalPearl, "id">) => void;
  onAddTask?: (task: Omit<DailyTask, "id">) => void;
  onUpdateAppState?: React.Dispatch<React.SetStateAction<any>>;
}

export const TelegramHubView: React.FC<TelegramHubViewProps> = ({
  onUpdateQuestion,
  onRecordAttempt,
  onAddToErrorNotebook,
  onSaveAsPearl,
}) => {
  // 1. Connection & Live Cloud Status State
  const [isConnected, setIsConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string; firstName: string; username?: string; phone: string } | null>(null);
  const [workerHealth, setWorkerHealth] = useState<{ status: string; lastHeartbeat: string; activeSourcesCount: number; lastSync?: string }>({
    status: "ONLINE",
    lastHeartbeat: new Date().toISOString(),
    activeSourcesCount: 0,
  });
  const [dbHealth, setDbHealth] = useState<{ status: string; totalMessages: number; totalQuestions: number; totalPearls: number }>({
    status: "CONNECTED",
    totalMessages: 0,
    totalQuestions: 0,
    totalPearls: 0,
  });

  // 2. Data Feed State
  const [questions, setQuestions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [pearls, setPearls] = useState<any[]>([]);
  const [crossChecks, setCrossChecks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  // 3. UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<"questions" | "images" | "videos" | "tips" | "notices" | "pearls" | "cross_checks" | "sources" | "debugger">("questions");

  // 4. Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "high_yield">("newest");

  // 5. Auth Modal & Flow State (Default: QR Code login)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<"qr" | "phone">("qr");
  const [authStep, setAuthStep] = useState<"phone" | "code" | "2fa">("phone");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [password2FAInput, setPassword2FAInput] = useState("");
  const [apiIdInput, setApiIdInput] = useState("");
  const [apiHashInput, setApiHashInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // 6. Interactive Element State
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [expandedWhyWrong, setExpandedWhyWrong] = useState<Record<string, boolean>>({});
  const [userSelections, setUserSelections] = useState<Record<string, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [savedBookmarkIds, setSavedBookmarkIds] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const qrPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load Feed on Initial Mount
  useEffect(() => {
    fetchStatus();
    fetchFeed();
    const interval = setInterval(() => {
      fetchStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle QR polling lifecycle
  useEffect(() => {
    if (isConnectModalOpen && authMethod === "qr" && !isConnected) {
      handleGenerateQr();
    } else {
      if (qrPollingRef.current) clearInterval(qrPollingRef.current);
    }
    return () => {
      if (qrPollingRef.current) clearInterval(qrPollingRef.current);
    };
  }, [isConnectModalOpen, authMethod, isConnected]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/telegram/cloud/status");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsConnected(Boolean(data.isConnected));
          setUserProfile(data.userProfile);
          if (data.worker) setWorkerHealth(data.worker);
          if (data.database) setDbHealth(data.database);
        }
      }
    } catch (_) {}
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/telegram/cloud/feed");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions || []);
          setMessages(data.messages || []);
          setMedia(data.media || []);
          setTips(data.tips || []);
          setNotices(data.notices || []);
          setPearls(data.pearls || []);
          setCrossChecks(data.crossChecks || []);
          setSources(data.sources || []);
        }
      }
    } catch (_) {}
  };

  const fetchSources = async (query = "") => {
    try {
      const res = await fetch(`/api/telegram/cloud/sources?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sources)) {
          setSources(data.sources);
        }
      }
    } catch (_) {}
  };

  // QR Code Flow Handlers
  const handleGenerateQr = async () => {
    setIsQrLoading(true);
    setAuthError(null);
    if (qrPollingRef.current) clearInterval(qrPollingRef.current);

    try {
      const res = await fetch("/api/telegram/cloud/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId: apiIdInput.trim() || undefined,
          apiHash: apiHashInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
        setQrLink(data.qrLink || "");

        // Start polling for QR scan confirmation every 3 seconds
        qrPollingRef.current = setInterval(async () => {
          try {
            const checkRes = await fetch("/api/telegram/cloud/qr/check", { method: "POST" });
            const checkData = await checkRes.json();
            if (checkData.success && checkData.isAuthenticated) {
              if (qrPollingRef.current) clearInterval(qrPollingRef.current);
              setIsConnected(true);
              setUserProfile(checkData.userProfile);
              setIsConnectModalOpen(false);
              fetchStatus();
              fetchFeed();
              fetchSources();
              confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
            } else if (checkData.requires2FA) {
              if (qrPollingRef.current) clearInterval(qrPollingRef.current);
              setAuthStep("2fa");
            }
          } catch (_) {}
        }, 3000);
      } else {
        const mapped = mapTelegramAuthError(data.error || data);
        setAuthError(mapped.userMessage);
      }
    } catch (err: any) {
      const mapped = mapTelegramAuthError(err);
      setAuthError(mapped.userMessage);
    } finally {
      setIsQrLoading(false);
    }
  };

  // Live phone validation preview
  const livePhoneValidation = useMemo(() => {
    if (!phoneInput.trim()) return null;
    return normalizeTelegramPhoneNumber(phoneInput);
  }, [phoneInput]);

  // Phone Auth Flow Handlers
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const validation = normalizeTelegramPhoneNumber(phoneInput);
    console.log("[TelegramAuth Trace] RAW INPUT:", phoneInput);
    console.log("[TelegramAuth Trace] NORMALIZED INPUT:", validation.normalizedE164);
    console.log("[TelegramAuth Trace] FRONTEND VALIDATION RESULT:", validation.isValid);
    console.log("[TelegramAuth Trace] REQUEST PAYLOAD:", { phoneNumber: validation.normalizedE164 });

    if (!validation.isValid) {
      setAuthError(validation.error || "Enter a valid international phone number with country code, e.g. +919678393607 or +639123456789");
      return;
    }

    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/telegram/cloud/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: validation.normalizedE164,
          apiId: apiIdInput.trim() || undefined,
          apiHash: apiHashInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPhoneCodeHash(data.phoneCodeHash || "");
        setAuthStep("code");
        setAuthError(null);
      } else {
        const mapped = mapTelegramAuthError(data.error || data);
        setAuthError(mapped.userMessage);
      }
    } catch (err: any) {
      const mapped = mapTelegramAuthError(err);
      setAuthError(mapped.userMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    const validation = normalizeTelegramPhoneNumber(phoneInput);
    const cleanPhone = validation.isValid ? validation.normalizedE164 : phoneInput;

    try {
      const res = await fetch("/api/telegram/cloud/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          phoneCodeHash,
          phoneCode: codeInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.requires2FA) {
          setAuthStep("2fa");
        } else {
          setIsConnected(true);
          setUserProfile(data.userProfile);
          setIsConnectModalOpen(false);
          fetchStatus();
          fetchFeed();
          fetchSources();
          confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
        }
      } else {
        const mapped = mapTelegramAuthError(data.error || data);
        setAuthError(mapped.userMessage);
      }
    } catch (err: any) {
      const mapped = mapTelegramAuthError(err);
      setAuthError(mapped.userMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/telegram/cloud/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: password2FAInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsConnected(true);
        setUserProfile(data.userProfile);
        setIsConnectModalOpen(false);
        fetchStatus();
        fetchFeed();
        fetchSources();
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
      } else {
        const mapped = mapTelegramAuthError(data.error || data);
        setAuthError(mapped.userMessage);
      }
    } catch (err: any) {
      const mapped = mapTelegramAuthError(err);
      setAuthError(mapped.userMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/telegram/cloud/disconnect", { method: "POST" });
      setIsConnected(false);
      setUserProfile(null);
      fetchStatus();
    } catch (_) {}
  };

  const handleToggleSource = async (sourceId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/telegram/cloud/sources/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, isMonitored: !currentStatus }),
      });
      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? { ...s, isMonitored: !currentStatus } : s))
        );
        fetchStatus();
      }
    } catch (_) {}
  };

  const [importingSourceId, setImportingSourceId] = useState<string | null>(null);

  const handleImportHistory = async (sourceId: string, limit: number) => {
    setImportingSourceId(sourceId);
    try {
      const res = await fetch("/api/telegram/sources/import-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, limit }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFeed();
        fetchStatus();
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      }
    } catch (_) {
    } finally {
      setImportingSourceId(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all Telegram imported questions and sources to 0? This will NOT delete your standard FMGE syllabus or error notebook.")) {
      return;
    }
    try {
      await fetch("/api/telegram/reset", { method: "POST" });
      fetchFeed();
      fetchStatus();
      fetchSources();
    } catch (_) {}
  };

  const handleSelectOption = (q: any, key: string) => {
    if (revealedQuestions[q.id]) return;

    setUserSelections((prev) => ({ ...prev, [q.id]: key }));
    setRevealedQuestions((prev) => ({ ...prev, [q.id]: true }));

    const isCorrect = key.toUpperCase() === q.correctAnswer.toUpperCase();

    if (isCorrect) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } else {
      onAddToErrorNotebook?.({
        subjectId: q.subject || "medicine",
        topic: q.topic || "Telegram Question",
        topicId: q.topic || "Telegram Question",
        questionGist: q.questionText,
        myMistake: "Selected option (" + key + ")",
        correctConcept: q.explanation + " — Key: " + q.correctAnswer,
        isReviewed: false,
      });
    }

    onRecordAttempt?.({
      questionId: q.id,
      subjectId: q.subject || "medicine",
      topicId: q.topic || "Telegram Practice",
      topicName: q.topic || "Telegram Practice",
      isCorrect,
      selectedAnswer: key,
      selectedOptionId: key,
      correctAnswer: q.correctAnswer,
      correctOptionId: q.correctAnswer,
      timeTakenSeconds: 15,
      source: "telegram",
    });
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubject !== "all" && q.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = (q.questionText + " " + q.topic + " " + q.subject + " " + q.sourceChannel).toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [questions, selectedSubject, searchQuery, sortBy]);

  const imageQuestions = useMemo(() => questions.filter((q) => Boolean(q.imageAssetId)), [questions]);
  const videoQuestions = useMemo(() => questions.filter((q) => Boolean(q.videoAssetId)), [questions]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16 font-['Plus_Jakarta_Sans']">
      {/* 1. Live Cloud Health Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? "bg-emerald-400 opacity-75" : "bg-slate-300 opacity-75"}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
              </span>
              <span className={`text-xs font-bold font-['Outfit'] tracking-wider uppercase ${isConnected ? "text-emerald-700" : "text-slate-500"}`}>
                {isConnected ? "● TELEGRAM CONNECTED" : "○ TELEGRAM DISCONNECTED"}
              </span>

              <span className="text-slate-300">•</span>

              <span className="flex items-center gap-1 text-xs font-bold font-['Outfit'] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                <Cpu className="h-3 w-3" /> Worker {workerHealth.status}
              </span>

              <span className="text-slate-300">•</span>

              <span className="flex items-center gap-1 text-xs font-bold font-['Outfit'] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                <Database className="h-3 w-3" /> PostgreSQL {dbHealth.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900">
              Telegram Ingestion & Knowledge Bank
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
              Persistent cloud MTProto worker ingesting high-yield clinical questions 24/7 with PostgreSQL persistence, independent Exam Pearls, and AI Cross-Check.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block">{userProfile?.firstName || "Doctor"}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{userProfile?.phone}</span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold font-['Outfit'] transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMethod("qr");
                  setAuthStep("phone");
                  setAuthError(null);
                  setIsConnectModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-['Outfit'] shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Connect Telegram Account
              </button>
            )}

            <button
              onClick={() => {
                fetchStatus();
                fetchFeed();
                fetchSources();
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
              title="Refresh Feed"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cloud Metrics Banner */}
        <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs font-['Outfit']">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Cloud Knowledge Bank:</span>
          <div className="flex items-center gap-3 flex-wrap text-slate-600">
            <span><strong className="text-slate-900 font-bold">{questions.length}</strong> Questions</span>
            <span>•</span>
            <span><strong className="text-sky-700 font-bold">{imageQuestions.length}</strong> Images</span>
            <span>•</span>
            <span><strong className="text-amber-700 font-bold">{videoQuestions.length}</strong> Videos</span>
            <span>•</span>
            <span><strong className="text-purple-700 font-bold">{pearls.length}</strong> Pearls</span>
            <span>•</span>
            <span><strong className="text-emerald-700 font-bold">{notices.length}</strong> Notices</span>
            <span>•</span>
            <span><strong className="text-indigo-700 font-bold">{workerHealth.activeSourcesCount}</strong> Monitored Sources</span>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          {[
            { id: "questions", label: "Questions (" + questions.length + ")", icon: FileText },
            { id: "images", label: "Images (" + imageQuestions.length + ")", icon: ImageIcon },
            { id: "videos", label: "Videos (" + videoQuestions.length + ")", icon: Video },
            { id: "pearls", label: "Exam Pearls (" + pearls.length + ")", icon: Sparkles },
            { id: "tips", label: "Tips (" + tips.length + ")", icon: Lightbulb },
            { id: "notices", label: "Notices (" + notices.length + ")", icon: Bell },
            { id: "cross_checks", label: "AI Cross-Check (" + crossChecks.length + ")", icon: ShieldCheck },
            { id: "sources", label: "Sources (" + workerHealth.activeSourcesCount + " Active)", icon: Layers },
            { id: "debugger", label: "Raw Messages (" + messages.length + ")", icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "sources") fetchSources();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Subject Filter Bar */}
      {(activeTab === "questions" || activeTab === "images" || activeTab === "videos") && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search question stem, drug of choice, clinical triad, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All 19 Subjects</option>
                {FMGE_SUBJECTS.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.weightage}M)
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: QUESTIONS / IMAGES / VIDEOS */}
      {/* ========================================================================= */}
      {(activeTab === "questions" || activeTab === "images" || activeTab === "videos") && (
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
                No Telegram questions ingested yet.
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Connect your personal Telegram account and select channels to monitor in the <strong>Sources</strong> tab. The Cloud Worker will automatically stream incoming messages.
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isRevealed = revealedQuestions[q.id];
              const selectedKey = userSelections[q.id];
              const isWhyWrongOpen = expandedWhyWrong[q.id];
              const crossCheck = crossChecks.find((c) => c.questionId === q.id);

              return (
                <div
                  key={q.id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-['Outfit'] bg-slate-100 text-slate-700 uppercase">
                        {q.subject || "MEDICINE"}
                      </span>
                      <span className="text-xs font-medium text-slate-600 truncate max-w-xs">
                        {q.topic || "Clinical Recall"}
                      </span>
                      {q.imageAssetId && (
                        <span className="flex items-center gap-1 text-[10px] font-bold font-['Outfit'] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <ImageIcon className="h-3 w-3" /> IBQ
                        </span>
                      )}
                      {q.videoAssetId && (
                        <span className="flex items-center gap-1 text-[10px] font-bold font-['Outfit'] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Video className="h-3 w-3" /> Video Clip
                        </span>
                      )}
                      {q.isDuplicate && (
                        <span className="flex items-center gap-1 text-[10px] font-bold font-['Outfit'] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          <AlertTriangle className="h-3 w-3" /> Possible Duplicate
                        </span>
                      )}
                      {crossCheck && crossCheck.agreementStatus === "DISAGREED" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold font-['Outfit'] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3 w-3 text-amber-600" /> ⚠️ ANSWER CONFLICT
                        </span>
                      ) : crossCheck ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold font-['Outfit'] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="h-3 w-3" /> AI Verified
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1 text-[10px] font-bold font-['Outfit'] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        <CheckCheck className="h-3 w-3 text-emerald-600" /> Auto-Saved
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Source: {q.sourceChannel}
                    </span>
                  </div>

                  {/* Question Stem */}
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* MCQ Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt: any) => {
                      const optKey = opt.key;
                      const isSelected = selectedKey === optKey;
                      const isCorrectKey = optKey.toUpperCase() === q.correctAnswer.toUpperCase();

                      let buttonStyle = "border-slate-200/80 bg-white hover:border-slate-300 text-slate-800";

                      if (isRevealed) {
                        if (isCorrectKey) {
                          buttonStyle = "border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold";
                        } else if (isSelected && !isCorrectKey) {
                          buttonStyle = "border-rose-400 bg-rose-50/80 text-rose-900 font-semibold";
                        } else {
                          buttonStyle = "border-slate-100 bg-slate-50/40 text-slate-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={opt.key}
                          disabled={isRevealed}
                          onClick={() => handleSelectOption(q, optKey)}
                          className={`p-3.5 rounded-2xl border text-left text-xs transition-all flex items-start justify-between gap-2 cursor-pointer disabled:cursor-default ${buttonStyle}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="font-bold font-mono text-slate-500">{opt.key})</span>
                            <span>{opt.text}</span>
                          </div>
                          {isRevealed && isCorrectKey && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                          {isRevealed && isSelected && !isCorrectKey && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation, Pearl, Mnemonic & Distractor Drawer */}
                  {isRevealed && (() => {
                    const enrichment = enrichClinicalQuestion(q);
                    const distractors = enrichment.whyOtherOptionsAreWrong;

                    return (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-bold font-['Outfit'] text-slate-900">
                              Telegram Answer: Option {q.correctAnswer}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {q.explanation}
                        </p>

                        {/* High-Yield FMGE Pearl */}
                        {enrichment.highYieldPearl && (
                          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs space-y-1 text-amber-950 shadow-2xs">
                            <div className="flex items-center gap-1.5 font-bold font-['Outfit'] text-amber-900">
                              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                              <span>💡 FMGE High-Yield Takeaway</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                              {enrichment.highYieldPearl}
                            </p>
                          </div>
                        )}

                        {/* Clinical Mnemonic & Memory Hook */}
                        {enrichment.mnemonic && (
                          <div className="p-3 rounded-xl bg-purple-50/90 border border-purple-200/90 text-xs space-y-1 text-purple-950 shadow-2xs">
                            <div className="flex items-center gap-1.5 font-bold font-['Outfit'] text-purple-900">
                              <Brain className="h-4 w-4 text-purple-600 shrink-0" />
                              <span>🧠 Clinical Memory Hook & Mnemonic</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-purple-900/90 font-medium">
                              {enrichment.mnemonic}
                            </p>
                          </div>
                        )}

                        {/* AI Cross-Check Analysis */}
                        {crossCheck && (
                          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            crossCheck.agreementStatus === "DISAGREED"
                              ? "bg-amber-50 border-amber-200 text-amber-900"
                              : "bg-emerald-50 border-emerald-200 text-emerald-900"
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold font-['Outfit']">
                              {crossCheck.agreementStatus === "DISAGREED" ? (
                                <>
                                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span>⚠️ ANSWER CONFLICT: Telegram Answer ({crossCheck.originalAnswer}) vs AI Analysis ({crossCheck.aiAnswer})</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>AI Cross-Check Verified ({crossCheck.aiAnswer})</span>
                                </>
                              )}
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-90">{crossCheck.reason}</p>
                          </div>
                        )}

                        {distractors && distractors.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60">
                            <button
                              onClick={() => setExpandedWhyWrong((prev) => ({ ...prev, [q.id]: !isWhyWrongOpen }))}
                              className="flex items-center gap-1 text-[11px] font-bold font-['Outfit'] text-slate-700 hover:text-slate-950 cursor-pointer"
                            >
                              {isWhyWrongOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              Why Other Options Are Wrong ({distractors.length})
                            </button>

                            {isWhyWrongOpen && (
                              <div className="mt-2.5 space-y-2 animate-fadeIn">
                                {distractors.map((dist: any) => (
                                  <div key={dist.key} className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] shadow-2xs leading-relaxed">
                                    <strong className="text-slate-900 font-bold font-['Outfit']">Option {dist.key}:</strong>{" "}
                                    <span className="text-slate-700">{dist.reason}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: EXAM PEARLS */}
      {/* ========================================================================= */}
      {activeTab === "pearls" && (
        <div className="space-y-4">
          {pearls.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <Sparkles className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">No Exam Pearls yet.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">High-yield takeaways extracted by the Cloud Worker are automatically preserved here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pearls.map((p) => (
                <div key={p.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-['Outfit'] bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      {p.subject || "MEDICINE"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Exam Pearl • Auto-Saved</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{p.title}</h4>
                  <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-950 leading-relaxed font-medium">
                    {p.takeaway}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW C: SOURCE SELECTOR (Channels & Groups Discovery) */}
      {/* ========================================================================= */}
      {activeTab === "sources" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
                Telegram Sources ({sources.length} Discovered • {workerHealth.activeSourcesCount} Monitored)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select exactly which channels and groups the persistent cloud worker should monitor. (Starts with 0 selected).
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search dialogs..."
                value={sourceSearchQuery}
                onChange={(e) => {
                  setSourceSearchQuery(e.target.value);
                  fetchSources(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {sources.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
              {isConnected
                ? "No channels or groups found on this Telegram account."
                : "Connect your Telegram account above to retrieve your accessible channels and groups."}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{src.title}</span>
                      {src.username && (
                        <span className="text-[11px] text-slate-400 font-mono">@{src.username}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                        {src.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {src.memberCount > 0 ? `${src.memberCount.toLocaleString()} members • ` : ""}
                      Last message checkpoint: #{src.lastProcessedMessageId || 0}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {src.isMonitored && (
                      <div className="flex items-center gap-1">
                        <button
                          disabled={importingSourceId === src.id}
                          onClick={() => handleImportHistory(src.id, 50)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 cursor-pointer"
                        >
                          {importingSourceId === src.id ? "Importing..." : "Import 50"}
                        </button>
                        <button
                          disabled={importingSourceId === src.id}
                          onClick={() => handleImportHistory(src.id, 100)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 cursor-pointer"
                        >
                          100
                        </button>
                        <button
                          disabled={importingSourceId === src.id}
                          onClick={() => handleImportHistory(src.id, 250)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 cursor-pointer hidden sm:inline-block"
                        >
                          250
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleToggleSource(src.id, src.isMonitored)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer flex items-center gap-1.5 ${
                        src.isMonitored
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {src.isMonitored ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {src.isMonitored ? "Monitored" : "Monitor"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Clean Start: Telegram tables are isolated in PostgreSQL.
            </span>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Telegram Database
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW D: AI CROSS-CHECKS */}
      {/* ========================================================================= */}
      {activeTab === "cross_checks" && (
        <div className="space-y-3">
          {crossChecks.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" />
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">No AI Cross-Checks performed yet.</h3>
            </div>
          ) : (
            crossChecks.map((cc) => (
              <div key={cc.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      cc.agreementStatus === "AGREED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {cc.agreementStatus}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Original: {cc.originalAnswer} vs AI: {cc.aiAnswer}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{cc.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW E: DEBUGGER & RAW STREAM */}
      {/* ========================================================================= */}
      {activeTab === "debugger" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
              Raw Ingested Message Stream ({messages.length} messages in PostgreSQL)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-['Outfit'] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Message ID</th>
                  <th className="py-2.5 px-3">Source ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Content</th>
                  <th className="py-2.5 px-3">Media</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 px-3 font-bold text-slate-900">#{m.telegramMessageId}</td>
                    <td className="py-2 px-3 text-slate-600 font-['Outfit']">{m.sourceId}</td>
                    <td className="py-2 px-3 text-slate-400 text-[10px]">
                      {new Date(m.messageDate).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-slate-700 max-w-xs truncate font-['Plus_Jakarta_Sans']">
                      {m.rawText || "[Media]"}
                    </td>
                    <td className="py-2 px-3 font-bold text-[10px]">{m.mediaType}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTHENTICATION MODAL: QR CODE (Default) + PHONE NUMBER (Fallback) */}
      {/* ========================================================================= */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-slate-700" />
                <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
                  Telegram User Authentication
                </h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Auth Method Selector Tabs */}
            {authStep === "phone" && (
              <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
                <button
                  onClick={() => {
                    setAuthMethod("qr");
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === "qr"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  QR Code (Recommended)
                </button>
                <button
                  onClick={() => {
                    setAuthMethod("phone");
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === "phone"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Phone Number
                </button>
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-fadeIn">
                {authError}
              </div>
            )}

            {/* METHOD 1: REAL MTPROTO QR CODE AUTHENTICATION */}
            {authMethod === "qr" && authStep === "phone" && (
              <div className="text-center space-y-4 py-2">
                <div className="mx-auto w-64 h-64 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center overflow-hidden p-3 shadow-inner">
                  {isQrLoading ? (
                    <div className="space-y-2 text-center text-xs text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-600" />
                      <span>Generating Telegram Login QR...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <img src={qrDataUrl} alt="Telegram Login QR Code" className="w-full h-full object-contain rounded-2xl" />
                  ) : (
                    <div className="text-xs text-slate-400">QR Generation Failed</div>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-bold text-slate-900 font-['Outfit']">How to Login with QR Code:</p>
                  <ol className="text-left list-decimal list-inside space-y-1 text-slate-500 max-w-xs mx-auto text-[11px]">
                    <li>Open <strong>Telegram</strong> on your phone</li>
                    <li>Go to <strong>Settings</strong> $ightarrow$ <strong>Devices</strong></li>
                    <li>Tap <strong>Link Desktop Device</strong></li>
                    <li>Point your camera at this QR code</li>
                  </ol>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleGenerateQr}
                    disabled={isQrLoading}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-['Outfit'] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isQrLoading ? "animate-spin" : ""}`} />
                    Refresh QR Code
                  </button>
                  <button
                    onClick={() => {
                      setAuthMethod("phone");
                      setAuthError(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all cursor-pointer"
                  >
                    Use Phone Number instead
                  </button>
                </div>
              </div>
            )}

            {/* METHOD 2: PHONE NUMBER STEP 1 */}
            {authMethod === "phone" && authStep === "phone" && (
              <form onSubmit={handleSendCode} noValidate className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold font-['Outfit'] uppercase tracking-wider text-slate-400">
                      Phone Number (E.164 International Format)
                    </label>
                    {livePhoneValidation?.isValid && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ {livePhoneValidation.countryCode} {livePhoneValidation.nationalNumber ? `(${livePhoneValidation.nationalNumber.length} digits)` : ""}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="+919678393607 or +639123456789"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none font-mono"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts international format with leading <strong>+</strong>: India (+91), Philippines (+63), US (+1), UK (+44), etc.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold font-['Outfit'] text-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? "Connecting to Telegram MTProto..." : "Send Verification Code"}
                </button>
              </form>
            )}

            {/* METHOD 2: VERIFICATION CODE STEP 2 */}
            {authStep === "code" && (
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <div>
                  <label className="text-xs font-bold font-['Outfit'] uppercase tracking-wider text-slate-400 block mb-1">
                    Telegram Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="12345"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none font-mono tracking-widest text-center text-lg font-bold"
                    autoFocus
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the code sent to your official Telegram app or SMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold font-['Outfit'] text-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            )}

            {/* 2FA PASSWORD STEP */}
            {authStep === "2fa" && (
              <form onSubmit={handleVerify2FA} className="space-y-3">
                <div>
                  <label className="text-xs font-bold font-['Outfit'] uppercase tracking-wider text-slate-400 block mb-1">
                    Telegram 2FA Cloud Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your 2FA password"
                    value={password2FAInput}
                    onChange={(e) => {
                      setPassword2FAInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none"
                    autoFocus
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your Telegram account has two-step verification enabled.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold font-['Outfit'] text-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? "Authenticating..." : "Complete 2FA Login"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
