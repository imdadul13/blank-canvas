import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
  ChevronLeft,
  ChevronRight,
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
  Star,
  Tag,
  Trash2,
  Edit3,
  Filter,
  Award,
  Send,
  ArrowRight,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { enrichClinicalQuestion } from "../utils/clinicalDistractorHelper";
import {
  TelegramMCQ,
  DailyTask,
  MedicalPearl,
  ErrorNotebookItem,
  CanonicalKnowledgeItem,
  KnowledgeBankCounts,
  KnowledgeBankDiagnostics,
  FormattedRawTelegramMessage,
} from "../types";
import { NewMcqAttemptInput } from "../utils/performanceEngine";
import { FMGE_SUBJECTS } from "../data/fmgeSubjects";
import {
  normalizeTelegramPhoneNumber,
  mapTelegramAuthError,
} from "../utils/phoneValidation";
import { TelegramStatusCards } from "./telegram/TelegramStatusCards";
import { TelegramOverviewCard } from "./telegram/TelegramOverviewCard";
import { TelegramSubjectCollections } from "./telegram/TelegramSubjectCollections";
import { TelegramQuickActions } from "./telegram/TelegramQuickActions";
import { TelegramEmptyState } from "./telegram/TelegramEmptyState";
import { TelegramKnowledgeCards, UnifiedKnowledgeItem } from "./telegram/TelegramKnowledgeCards";

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

  // 2. Data Feed State — Phase 2 Canonical Hub State
  const [curatedItems, setCuratedItems] = useState<CanonicalKnowledgeItem[]>([]);
  const [rawMessages, setRawMessages] = useState<FormattedRawTelegramMessage[]>([]);
  const [curatedCounts, setCuratedCounts] = useState<KnowledgeBankCounts>({
    totalCurated: 0,
    examPearls: 0,
    questions: 0,
    imageSpotters: 0,
    videos: 0,
    clinicalTips: 0,
    notices: 0,
  });
  const [pipelineDiagnostics, setPipelineDiagnostics] = useState<KnowledgeBankDiagnostics | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(true);
  const [feedPage, setFeedPage] = useState<number>(1);
  const [hasMorePages, setHasMorePages] = useState<boolean>(false);

  // Legacy compatibility arrays
  const [questions, setQuestions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [pearls, setPearls] = useState<any[]>([]);
  const [crossChecks, setCrossChecks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [canonicalItems, setCanonicalItems] = useState<any[]>([]);

  // 3. UI Navigation Tabs (including "all" and Dedicated Saved Vault)
  const [activeTab, setActiveTab] = useState<
    "all" | "questions" | "saved" | "images" | "videos" | "tips" | "notices" | "pearls" | "cross_checks" | "sources" | "debugger"
  >("all");
  const [mobileSegment, setMobileSegment] = useState<"overview" | "browse" | "saved">("overview");
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 4. Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedChannelId, setSelectedChannelId] = useState("all");
  const [savedFilterSubject, setSavedFilterSubject] = useState("all");
  const [savedFilterType, setSavedFilterType] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "high_yield">("newest");
  const [highYieldOnly, setHighYieldOnly] = useState<boolean>(false);
  const [rawStateFilter, setRawStateFilter] = useState<
    "ALL" | "CURATED" | "PROMOTIONAL" | "DUPLICATE" | "LOW_YIELD" | "FAILED"
  >("ALL");

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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [studentNoteInput, setStudentNoteInput] = useState<string>("");
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [isReEnriching, setIsReEnriching] = useState<boolean>(false);
  const [syncBannerNotice, setSyncBannerNotice] = useState<string | null>(null);
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

  const fetchFeed = async (pageToFetch = 1) => {
    try {
      setIsLoadingFeed(true);
      const res = await fetch(`/api/telegram/cloud/feed?page=${pageToFetch}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Curated canonical knowledge items
          const incomingCurated: CanonicalKnowledgeItem[] = Array.isArray(data.curatedItems)
            ? data.curatedItems
            : Array.isArray(data.canonicalItems)
            ? data.canonicalItems
            : [];
          setCuratedItems((prev) => (pageToFetch === 1 ? incomingCurated : [...prev, ...incomingCurated]));

          // Raw Telegram ingestion stream
          const incomingRaw: FormattedRawTelegramMessage[] = Array.isArray(data.rawMessages)
            ? data.rawMessages
            : Array.isArray(data.messages)
            ? data.messages
            : [];
          setRawMessages(incomingRaw);

          // Real counts
          if (data.counts) {
            setCuratedCounts(data.counts);
          } else if (incomingCurated.length > 0) {
            setCuratedCounts({
              totalCurated: incomingCurated.length,
              examPearls: incomingCurated.filter((i) => i.type === "pearl").length,
              questions: incomingCurated.filter((i) => i.type === "question").length,
              imageSpotters: incomingCurated.filter((i) => i.type === "image").length,
              videos: incomingCurated.filter((i) => i.type === "video").length,
              clinicalTips: incomingCurated.filter((i) => i.type === "tip").length,
              notices: incomingCurated.filter((i) => i.type === "notice").length,
            });
          }

          // Real diagnostics
          if (data.diagnostics) {
            setPipelineDiagnostics(data.diagnostics);
          }

          // Pagination
          if (data.pagination) {
            setHasMorePages(Boolean(data.pagination.hasMore));
            setFeedPage(data.pagination.page || pageToFetch);
          }

          // Legacy compatibility
          setQuestions(data.questions || []);
          setMessages(data.messages || incomingRaw);
          setMedia(data.media || []);
          setTips(data.tips || []);
          setNotices(data.notices || []);
          setPearls(data.pearls || []);
          setCrossChecks(data.crossChecks || []);
          setSources(data.sources || []);
          setCanonicalItems(incomingCurated);

          if (Array.isArray(data.savedItems)) {
            setSavedItems(data.savedItems);
            const bookmarkMap: Record<string, boolean> = {};
            data.savedItems.forEach((si: any) => {
              if (si.itemId) bookmarkMap[si.itemId] = true;
              if (si.originalId) bookmarkMap[si.originalId] = true;
              if (si.id) bookmarkMap[si.id] = true;
            });
            setSavedBookmarkIds(bookmarkMap);
          }
        }
      }
    } catch (_) {
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleToggleSaveItem = async (item: {
    itemId: string;
    itemType: "question" | "notice" | "tip" | "pearl" | "media";
    subject: string;
    title: string;
    content: string;
    mediaUrl?: string;
    mediaType?: "IMAGE" | "VIDEO" | "POLL" | "NONE";
    options?: { key: string; text: string }[];
    correctAnswer?: string;
    explanation?: string;
    tags?: string[];
    studentNotes?: string;
    sourceChannel?: string;
  }) => {
    try {
      const res = await fetch("/api/telegram/saved/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.isSaved && data.item) {
            setSavedItems((prev) => [data.item, ...prev.filter((i) => i.itemId !== item.itemId)]);
            setSavedBookmarkIds((prev) => ({ ...prev, [item.itemId]: true }));
            confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
          } else {
            setSavedItems((prev) => prev.filter((i) => i.itemId !== item.itemId));
            setSavedBookmarkIds((prev) => ({ ...prev, [item.itemId]: false }));
          }
        }
      }
    } catch (_) {}
  };

  const handleUpdateSavedNotes = async (id: string, notes: string, tags?: string[]) => {
    try {
      const res = await fetch("/api/telegram/saved/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes, tags }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.item) {
          setSavedItems((prev) => prev.map((i) => (i.id === id || i.itemId === id ? data.item : i)));
          setEditingNoteId(null);
        }
      }
    } catch (_) {}
  };

  const handleDeleteSavedItem = async (id: string, itemId: string) => {
    try {
      const res = await fetch(`/api/telegram/saved/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedItems((prev) => prev.filter((i) => i.id !== id && i.itemId !== itemId));
        setSavedBookmarkIds((prev) => ({ ...prev, [itemId]: false }));
      }
    } catch (_) {}
  };

  const handleManualSyncNow = async () => {
    setIsManualSyncing(true);
    setSyncBannerNotice("Syncing Telegram… Scanning new messages… Curating educational content…");
    try {
      const res = await fetch("/api/telegram/cloud/sync-now", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const d = data.diagnostics || {};
          const scanned = d.scanned ?? d.totalScanned ?? data.newMessagesCount ?? 0;
          const newMsg = d.newMessages ?? data.newMessagesCount ?? 0;
          const promo = d.promotionalFiltered ?? data.promotionalFilteredCount ?? 0;
          const dupes = d.duplicatesMerged ?? data.duplicatesMergedCount ?? 0;
          const curated = d.curatedItems ?? data.curatedCount ?? data.newQuestionsCount ?? 0;
          setSyncBannerNotice(
            `Sync complete — ${scanned} messages scanned • ${newMsg} new • ${promo} filtered • ${dupes} duplicates merged • ${curated} high-yield items added`
          );
          await fetchFeed(1);
          await fetchStatus();
          confetti({ particleCount: 45, spread: 65, origin: { y: 0.25 } });
        } else {
          setSyncBannerNotice(data.error || "Sync completed with no new updates.");
        }
      } else {
        setSyncBannerNotice("Could not reach worker. Retrying automatically in 30s.");
      }
    } catch (err: any) {
      setSyncBannerNotice("Sync failed: " + err.message);
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncBannerNotice(null), 8000);
    }
  };

  const handleReEnrichWithGemini = async () => {
    setIsReEnriching(true);
    setSyncBannerNotice("Gemini AI is verifying clinical questions, option distractors, and exam pearls...");
    try {
      const res = await fetch("/api/telegram/cloud/re-enrich", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncBannerNotice(`Gemini verified & updated ${data.enrichedCount || 0} questions & exam pearls!`);
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.25 } });
        fetchFeed();
      } else {
        setSyncBannerNotice(data.error || "Clinical review completed.");
      }
    } catch (err: any) {
      setSyncBannerNotice("Clinical review error: " + err.message);
    } finally {
      setIsReEnriching(false);
      setTimeout(() => setSyncBannerNotice(null), 8000);
    }
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

  // Filtered Questions with Subject, Tab, and Channel Selection (Legacy fallback)
  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (activeTab === "images" && !q.imageUrl && !q.imageAssetId) return false;
        if (activeTab === "videos" && !q.videoUrl && !q.videoAssetId) return false;
        if (selectedSubject !== "all" && q.subject?.toLowerCase() !== selectedSubject.toLowerCase()) return false;
        if (selectedChannelId !== "all") {
          const channelObj = sources.find((s) => s.id === selectedChannelId);
          if (channelObj && q.sourceChannel !== channelObj.title) return false;
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const text = (q.questionText + " " + q.topic + " " + q.subject + " " + q.sourceChannel).toLowerCase();
          if (!text.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [questions, selectedSubject, selectedChannelId, searchQuery, sortBy, sources, activeTab]);

  const imageQuestions = useMemo(
    () => questions.filter((q) => Boolean(q.imageAssetId || q.imageUrl)),
    [questions]
  );

  const videoQuestions = useMemo(
    () => questions.filter((q) => Boolean(q.videoAssetId || q.videoUrl)),
    [questions]
  );

  const filteredTips = useMemo(() => {
    return tips.filter((t) => {
      if (selectedSubject !== "all" && t.subject?.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = ((t.cleanedText || t.originalText || "") + " " + (t.subject || "") + " " + (t.sourceChannel || "")).toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [tips, selectedSubject, searchQuery]);

  const filteredPearls = useMemo(() => {
    return pearls.filter((p) => {
      if (selectedSubject !== "all" && p.subject?.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = ((p.title || "") + " " + (p.takeaway || "") + " " + (p.subject || "")).toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [pearls, selectedSubject, searchQuery]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = ((n.cleanedText || n.originalText || "") + " " + (n.sourceChannel || "")).toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [notices, searchQuery]);

  const filteredCrossChecks = useMemo(() => {
    return crossChecks.filter((cc) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = ((cc.reason || "") + " " + cc.originalAnswer + " " + cc.aiAnswer + " " + cc.agreementStatus).toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [crossChecks, searchQuery]);

  const filteredSavedItems = useMemo(() => {
    return savedItems.filter((item) => {
      if (savedFilterSubject !== "all" && item.subject.toLowerCase() !== savedFilterSubject.toLowerCase()) return false;
      if (savedFilterType !== "all" && item.itemType !== savedFilterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = (item.title + " " + item.content + " " + item.subject + " " + (item.studentNotes || "")).toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [savedItems, savedFilterSubject, savedFilterType, searchQuery]);

  // Set of saved item IDs for instant lookup
  const savedItemIdsSet = useMemo(() => {
    return new Set(savedItems.map((item) => item.itemId || item.originalId || item.id));
  }, [savedItems]);

  // Unified latest knowledge items for "all" / "Latest from Your Knowledge Bank"
  const latestKnowledgeItems = useMemo<UnifiedKnowledgeItem[]>(() => {
    const list: UnifiedKnowledgeItem[] = [];

    // Prioritize high-yield curated canonical items
    if (canonicalItems && canonicalItems.length > 0) {
      canonicalItems.forEach((c) => {
        list.push({
          id: c.id,
          type: c.type,
          title: c.title || "Clinical High-Yield Takeaway",
          stem: c.content || c.title,
          content: c.content,
          pearlTakeaway: c.whatToRemember || (c.type === "pearl" ? c.content : undefined),
          whatToRemember: c.whatToRemember,
          subject: c.subject || "General Medicine",
          tags: [
            c.isHighYield ? "High-Yield" : "Curated",
            ...(c.sources && c.sources.length > 1
              ? [`${c.sources.length} Channels Verified`]
              : c.sources?.[0]?.sourceTitle
              ? [c.sources[0].sourceTitle]
              : ["FMGE Recall"]),
          ],
          createdAt: c.createdAt || new Date().toISOString(),
          imageUrl: c.mediaUrl && c.mediaType === "IMAGE" ? c.mediaUrl : undefined,
          videoUrl: c.mediaUrl && c.mediaType === "VIDEO" ? c.mediaUrl : undefined,
          mediaUrl: c.mediaUrl,
          mediaType: c.mediaType,
          options: c.options,
          correctAnswer: c.correctAnswer,
          explanation: c.explanation,
          distractorAnalysis: c.distractorAnalysis,
          sources: c.sources,
          fmgeRelevanceScore: c.fmgeRelevanceScore,
          isHighYield: c.isHighYield,
          originalData: c,
          isSaved: savedItemIdsSet.has(c.id),
        });
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Fallback: Questions & media questions
    questions.slice(0, 8).forEach((q) => {
      let type: UnifiedKnowledgeItem["type"] = "question";
      if (q.imageUrl || q.imageAssetId) type = "image";
      else if (q.videoUrl || q.videoAssetId) type = "video";

      list.push({
        id: q.id,
        type,
        title: q.questionText || "Clinical Question",
        stem: q.questionText,
        subject: q.subject || "General Medicine",
        tags: q.tags || ["PYQ"],
        createdAt: q.createdAt || new Date().toISOString(),
        imageUrl: q.imageUrl,
        videoUrl: q.videoUrl,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        originalData: q,
        isSaved: savedItemIdsSet.has(q.id),
      });
    });

    // Pearls
    pearls.slice(0, 4).forEach((p) => {
      list.push({
        id: p.id,
        type: "pearl",
        title: p.topic || "Clinical Pearl",
        stem: p.takeaway,
        pearlTakeaway: p.takeaway,
        subject: p.subject || "High Yield",
        tags: p.tags || ["Exam Pearl"],
        createdAt: p.dateAdded || new Date().toISOString(),
        originalData: p,
        isSaved: savedItemIdsSet.has(p.id),
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [canonicalItems, questions, pearls, savedItemIdsSet]);

  // Primary ONE SHOT CURATED filter memo
  const filteredCuratedItems = useMemo<CanonicalKnowledgeItem[]>(() => {
    let pool = curatedItems;
    if (pool.length === 0 && canonicalItems.length > 0) {
      pool = canonicalItems;
    }
    if (pool.length === 0 && latestKnowledgeItems.length > 0) {
      pool = latestKnowledgeItems as any;
    }

    return pool
      .filter((item) => {
        // Tab type filter
        if (activeTab === "pearls" && item.type !== "pearl") return false;
        if (activeTab === "questions" && item.type !== "question") return false;
        if (activeTab === "images" && item.type !== "image") return false;
        if (activeTab === "videos" && item.type !== "video") return false;
        if (activeTab === "tips" && item.type !== "tip") return false;
        if (activeTab === "notices" && item.type !== "notice") return false;

        // Subject filter
        if (selectedSubject !== "all" && item.subject?.toLowerCase() !== selectedSubject.toLowerCase()) {
          return false;
        }

        // Channel filter
        if (selectedChannelId !== "all") {
          const channelObj = sources.find((s) => s.id === selectedChannelId);
          if (channelObj) {
            const hasMatch =
              item.sources?.some(
                (src: any) => src.sourceTitle === channelObj.title || src.sourceId === channelObj.id
              ) || (item as any).sourceChannel === channelObj.title;
            if (!hasMatch) return false;
          }
        }

        // High-Yield Toggle
        if (highYieldOnly && !item.isHighYield && (item.fmgeRelevanceScore ?? 0) < 75) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const itemTags = (item as any).tags || [];
          const searchable = [
            item.title,
            item.content,
            (item as any).stem,
            item.whatToRemember,
            item.subject,
            item.topic,
            ...itemTags,
            ...(item.sources?.map((s: any) => s.sourceTitle) || []),
            (item as any).sourceChannel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!searchable.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "high_yield") {
          const scoreA = (a.isHighYield ? 100 : 0) + (a.fmgeRelevanceScore || 0);
          const scoreB = (b.isHighYield ? 100 : 0) + (b.fmgeRelevanceScore || 0);
          return scoreB - scoreA;
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [curatedItems, canonicalItems, latestKnowledgeItems, activeTab, selectedSubject, selectedChannelId, highYieldOnly, searchQuery, sortBy, sources]);

  // Secondary Source Library raw messages filter memo
  const filteredRawMessages = useMemo(() => {
    return rawMessages.filter((m) => {
      const msgStatus = (m as any).processingState || m.status;
      if (rawStateFilter !== "ALL") {
        if (rawStateFilter === "CURATED") {
          if (msgStatus !== "CURATED" && msgStatus !== "PROCESSED") return false;
        } else if (msgStatus !== rawStateFilter) {
          return false;
        }
      }

      if (selectedChannelId !== "all") {
        const channelObj = sources.find((s) => s.id === selectedChannelId);
        if (channelObj && m.sourceId !== channelObj.id && m.sourceTitle !== channelObj.title) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${m.rawText || ""} ${m.sourceTitle || ""} ${m.sourceId || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [rawMessages, rawStateFilter, selectedChannelId, searchQuery, sources]);

  // Dynamic real subject counts from curated canonical items (with fallback)
  const subjectCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    const pool = curatedItems.length > 0 ? curatedItems : canonicalItems;
    if (pool.length > 0) {
      pool.forEach((c) => {
        const s = (c.subject || "medicine").toLowerCase().trim();
        counts[s] = (counts[s] || 0) + 1;
      });
      return counts;
    }
    questions.forEach((q) => {
      const s = (q.subject || "medicine").toLowerCase().trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    pearls.forEach((p) => {
      const s = (p.subject || "medicine").toLowerCase().trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    tips.forEach((t) => {
      const s = (t.subject || "medicine").toLowerCase().trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [curatedItems, canonicalItems, questions, pearls, tips]);

  // Card MCQ selection handler for interactive solve drawer
  const handleSelectMCQOptionFromCard = (questionId: string, optionKey: string, isCorrect: boolean) => {
    if (revealedQuestions[questionId]) return;

    setUserSelections((prev) => ({ ...prev, [questionId]: optionKey }));
    setRevealedQuestions((prev) => ({ ...prev, [questionId]: true }));

    const item =
      curatedItems.find((ci) => ci.id === questionId) ||
      canonicalItems.find((ci) => ci.id === questionId) ||
      questions.find((q) => q.id === questionId);

    if (isCorrect) {
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.8 } });
    } else if (item) {
      onAddToErrorNotebook?.({
        subjectId: (item.subject || "medicine").toLowerCase().replace(/[^a-z]/g, ""),
        topic: item.topic || "Telegram Question",
        topicId: item.topic || "Telegram Question",
        questionGist: item.content || item.title || (item as any).questionText || "",
        myMistake: `Selected option (${optionKey})`,
        correctConcept: `${item.explanation || ""} — Correct Key: ${item.correctAnswer || ""}`,
        isReviewed: false,
      });
    }

    if (item) {
      onRecordAttempt?.({
        questionId,
        subjectId: (item.subject || "medicine").toLowerCase().replace(/[^a-z]/g, ""),
        topicId: item.topic || "Telegram Practice",
        topicName: item.topic || "Telegram Practice",
        isCorrect,
        selectedAnswer: optionKey,
        selectedOptionId: optionKey,
        correctAnswer: item.correctAnswer || "",
        correctOptionId: item.correctAnswer || "",
        timeTakenSeconds: 15,
        source: "telegram",
      });
    }
  };

  // Toggle Save handler for Canonical and Unified cards
  const handleToggleSaveCanonicalItem = (item: any) => {
    let itemType: "question" | "notice" | "tip" | "pearl" | "media" = "question";
    if (item.type === "pearl") itemType = "pearl";
    else if (item.type === "tip") itemType = "tip";
    else if (item.type === "notice") itemType = "notice";
    else if (item.type === "image" || item.type === "video") itemType = "media";

    handleToggleSaveItem({
      itemId: item.id,
      itemType,
      subject: item.subject || "General Medicine",
      title: item.title || "Clinical Takeaway",
      content: item.content || item.stem || item.title || "",
      mediaUrl: item.mediaUrl || item.imageUrl || item.videoUrl,
      mediaType: item.mediaType || (item.imageUrl || item.type === "image" ? "IMAGE" : item.videoUrl || item.type === "video" ? "VIDEO" : "NONE"),
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      tags: item.tags,
      sourceChannel: item.sources?.[0]?.sourceTitle || item.sourceChannel,
    });
  };

  const handleToggleUnifiedItem = (item: UnifiedKnowledgeItem) => {
    handleToggleSaveCanonicalItem(item);
  };

  const handleSearchFocus = () => {
    setActiveTab("questions");
    setMobileSegment("browse");
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // Category navigation scroll management for desktop & responsive safety
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkCategoryScroll = useCallback(() => {
    if (categoryNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryNavRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  }, []);

  useEffect(() => {
    checkCategoryScroll();
    const navEl = categoryNavRef.current;
    if (navEl) {
      navEl.addEventListener("scroll", checkCategoryScroll, { passive: true });
    }
    window.addEventListener("resize", checkCategoryScroll);
    return () => {
      if (navEl) {
        navEl.removeEventListener("scroll", checkCategoryScroll);
      }
      window.removeEventListener("resize", checkCategoryScroll);
    };
  }, [checkCategoryScroll]);

  // Re-check scroll state whenever activeTab or questions change
  useEffect(() => {
    const timer = setTimeout(checkCategoryScroll, 100);
    return () => clearTimeout(timer);
  }, [activeTab, questions.length, pearls.length, checkCategoryScroll]);

  const handleScrollCategories = (direction: "left" | "right") => {
    if (categoryNavRef.current) {
      const offset = direction === "left" ? -240 : 240;
      categoryNavRef.current.scrollBy({ left: offset, behavior: "smooth" });
      setTimeout(checkCategoryScroll, 300);
    }
  };

  return (
    <div
      data-accent="telegram"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8 animate-fadeIn pb-24 sm:pb-20 lg:pb-16 font-sans antialiased min-w-0 max-w-full overflow-x-clip text-slate-900"
    >
      {/* Telegram has its own accent scope, while its deep azure hero keeps
          the stream workspace visually distinct from study and performance. */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 45%, #075985 80%, #0C4A6E 100%)',
          boxShadow: '0 8px 40px rgba(2,132,199,0.24), 0 2px 8px rgba(0,0,0,0.10)',
        }}
      >
        {/* Decorative right glow + top inner shine */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-2/3"
          style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(56,189,248,0.30) 0%, transparent 65%)' }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/15 to-transparent" />

        <div className="relative z-10 px-5 sm:px-8 py-5 sm:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 min-w-0 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
                <Send className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10.5px] font-mono font-bold uppercase tracking-wider text-sky-100">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Source Library
              </span>
            </div>

            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Telegram Knowledge Bank
              </h1>
              <p className="text-[12.5px] sm:text-[13px] text-sky-100/80 leading-relaxed max-w-lg font-medium">
                High-yield FMGE content, clinical pearls, and image spotters intelligently curated from your verified sources.
              </p>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleManualSyncNow}
              disabled={isManualSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/25 text-[12px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 backdrop-blur-md shadow-xs"
            >
              <RefreshCw className={`size-3.5 text-sky-200 stroke-[2.4] ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Syncing...' : 'Sync Live Feed'}</span>
            </button>

            {!isConnected ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('qr');
                  setAuthStep('phone');
                  setAuthError(null);
                  setIsConnectModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-full bg-white hover:bg-[#F2F2F7] text-[#0369A1] text-[12px] font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <QrCode className="size-3.5 stroke-[2.6]" />
                <span>Connect MTProto</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[12px] font-bold shadow-xs">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MTProto Synced</span>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* 4 Metric Tiles Row Matching Screenshot 3 / ErrorsView / FmgePredictorView */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Curated',
            value: curatedCounts.totalCurated || curatedItems.length,
            sub: 'Verified clinical entries',
            icon: Layers,
            color: '#0284C7',
            bg: 'rgba(2,132,199,0.06)',
            border: 'rgba(2,132,199,0.18)',
          },
          {
            label: 'Exam Pearls',
            value: curatedCounts.examPearls,
            sub: 'High-yield takeaways',
            icon: Star,
            color: '#FF9500',
            bg: 'rgba(255,149,0,0.06)',
            border: 'rgba(255,149,0,0.18)',
          },
          {
            label: 'Clinical MCQs',
            value: curatedCounts.questions,
            sub: 'Vignettes with rationale',
            icon: HelpCircle,
            color: '#30D158',
            bg: 'rgba(48,209,88,0.06)',
            border: 'rgba(48,209,88,0.18)',
          },
          {
            label: 'Saved Vault',
            value: savedItems.length,
            sub: 'Student saved notes',
            icon: Bookmark,
            color: '#5856D6',
            bg: 'rgba(88,86,214,0.06)',
            border: 'rgba(88,86,214,0.18)',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div key={label} className="p-4 rounded-2xl border space-y-2" style={{ background: bg, borderColor: border }}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#8E8E93]">{label}</span>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
            </div>
            <div className="text-[26px] font-black font-mono leading-none" style={{ color }}>{value}</div>
            <p className="text-[11px] text-[#8E8E93]">{sub}</p>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 2. INFRASTRUCTURE STATUS (3 COMPACT CARDS) */}
      {/* ========================================================================= */}
      <TelegramStatusCards
        isConnected={isConnected}
        userProfile={userProfile}
        workerHealth={workerHealth}
        dbHealth={dbHealth}
        onOpenConnectModal={() => {
          setAuthMethod("qr");
          setAuthStep("phone");
          setAuthError(null);
          setIsConnectModalOpen(true);
        }}
        onOpenManageModal={() => setIsManageModalOpen(true)}
        onManualSync={handleManualSyncNow}
        isManualSyncing={isManualSyncing}
      />

      {/* Sync Toast / Progress Notice if active */}
      {syncBannerNotice && (
        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs flex items-center justify-between gap-2 animate-fadeIn shadow-2xs font-medium">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-600 shrink-0" />
            <span>{syncBannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncBannerNotice(null)}
            className="text-sky-400 hover:text-sky-700 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. YOUR CLOUD KNOWLEDGE BANK OVERVIEW BANNER */}
      {/* ========================================================================= */}
      <TelegramOverviewCard
        counts={curatedCounts}
        channelCount={workerHealth.activeSourcesCount}
      />

      {pipelineDiagnostics && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-800">
              Educational Guardrails Active
            </span>
            <span className="hidden sm:inline text-emerald-700">
              — Real-time promotional filtering, cross-channel deduplication &amp; FMGE relevance scoring (threshold &ge; 75).
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-mono font-semibold text-emerald-900">
            <span>
              <strong>{pipelineDiagnostics.promotionalFiltered}</strong> Ads Filtered
            </span>
            <span>
              <strong>{pipelineDiagnostics.duplicatesMerged}</strong> Duplicates Merged
            </span>
            <span>
              <strong>{curatedCounts.totalCurated || curatedItems.length}</strong> Curated Items
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MOBILE SEGMENTED CONTROL ([ Overview ] [ Browse ] [ Saved ]) */}
      {/* ========================================================================= */}
      <div className="sm:hidden flex rounded-2xl bg-stone-100 p-1 gap-1">
        {[
          { id: "overview", label: "Overview" },
          { id: "browse", label: "Browse" },
          { id: "saved", label: `Saved (${savedItems.length})` },
        ].map((seg) => (
          <button
            key={seg.id}
            type="button"
            onClick={() => {
              setMobileSegment(seg.id as any);
              if (seg.id === "saved") setActiveTab("saved");
              else if (seg.id === "overview") setActiveTab("all");
              else if (seg.id === "browse" && activeTab === "all") setActiveTab("questions");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileSegment === seg.id
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 5. KNOWLEDGE CATEGORY NAVIGATION (DESKTOP) & SEARCH (DESKTOP / MOBILE BROWSE) */}
      {/* ========================================================================= */}
      <div className={`space-y-4 w-full min-w-0 max-w-full ${mobileSegment === "overview" ? "hidden sm:block" : ""}`}>
        {/* Category Pill Tabs with Controlled Horizontal Overflow - DESKTOP ONLY */}
        <div className="relative w-full min-w-0 max-w-full hidden sm:block">
          {/* Left Scroll Gradient & Button (Desktop) */}
          {canScrollLeft && (
            <div className="hidden sm:flex absolute left-0 top-0 bottom-0 z-10 items-center pr-3 bg-gradient-to-r from-[#FBFBFA] via-[#FBFBFA]/90 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => handleScrollCategories("left")}
                aria-label="Scroll categories left"
                className="pointer-events-auto w-7 h-7 rounded-full bg-white border border-stone-200 shadow-md text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scrolling Row */}
          <div
            ref={categoryNavRef}
            className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 px-0.5 scrollbar-none scroll-smooth w-full min-w-0"
          >
            {[
              { id: "all", label: "Curated Feed", count: curatedCounts.totalCurated, icon: Layers, activeBg: "#0284C7" },
              { id: "pearls", label: "Exam Pearls", count: curatedCounts.examPearls, icon: Award, activeBg: "#D97706" },
              { id: "questions", label: "Questions", count: curatedCounts.questions, icon: FileText, activeBg: "#059669" },
              { id: "images", label: "Spotters", count: curatedCounts.imageSpotters, icon: ImageIcon, activeBg: "#7C3AED" },
              { id: "videos", label: "Videos", count: curatedCounts.videos, icon: Video, activeBg: "#E11D48" },
              { id: "tips", label: "Rapid Tips", count: curatedCounts.clinicalTips, icon: Lightbulb, activeBg: "#EA580C" },
              { id: "saved", label: "Vault", count: savedItems.length, icon: Star, highlight: true, activeBg: "#4F46E5" },
              { id: "cross_checks", label: "AI Cross-Check", count: crossChecks.length, icon: ShieldCheck, activeBg: "#007AFF" },
              { id: "sources", label: "Channels", count: workerHealth.activeSourcesCount, icon: Layers, activeBg: "#5856D6" },
              { id: "debugger", label: "Source Library (Raw)", count: rawMessages.length, icon: Terminal, activeBg: "#334155" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    setActiveTab(tab.id as any);
                    if (tab.id === "sources") fetchSources();
                    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                  }}
                  style={isActive ? { backgroundColor: tab.activeBg, color: 'white' } : undefined}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs ${
                    isActive
                      ? "text-white shadow-xs"
                      : tab.highlight && savedItems.length > 0
                      ? "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80"
                      : "bg-white hover:bg-stone-50 text-slate-700 border border-stone-200/90"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : tab.highlight ? "text-amber-600 fill-amber-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? "bg-white/20 text-white" : "bg-stone-100 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Scroll Gradient & Button (Desktop) */}
          {canScrollRight && (
            <div className="hidden sm:flex absolute right-0 top-0 bottom-0 z-10 items-center pl-3 bg-gradient-to-l from-[#FBFBFA] via-[#FBFBFA]/90 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => handleScrollCategories("right")}
                aria-label="Scroll categories right"
                className="pointer-events-auto w-7 h-7 rounded-full bg-white border border-stone-200 shadow-md text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search & Subject Filter Bar */}
        {(mobileSegment === "browse" || (activeTab !== "debugger" && activeTab !== "sources" && activeTab !== "saved")) && (
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search the knowledge bank by clinical stem, drug, triad, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/15 focus:border-[#007AFF] transition-all shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                {/* Subject Selector */}
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="rounded-xl border border-slate-200/90 bg-slate-100/90 hover:bg-slate-100 focus:bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15 focus:outline-none cursor-pointer transition-all shadow-xs"
                >
                  <option value="all">All 19 Subjects</option>
                  {FMGE_SUBJECTS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.weightage}M)
                    </option>
                  ))}
                </select>

                {/* Channel Selector */}
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="rounded-xl border border-slate-200/90 bg-slate-100/90 hover:bg-slate-100 focus:bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15 focus:outline-none cursor-pointer max-w-[170px] truncate transition-all shadow-xs"
                >
                  <option value="all">All Channels ({sources.length})</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.title} {src.isMonitored ? " (Live)" : ""}
                    </option>
                  ))}
                </select>

                {/* High-Yield Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setHighYieldOnly(!highYieldOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    highYieldOnly
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100/90 hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-xs"
                  }`}
                  title="Filter high-yield items with relevance score >= 75"
                >
                  <Flame className={`w-3.5 h-3.5 ${highYieldOnly ? "text-white" : "text-amber-500"}`} />
                  <span>High-Yield</span>
                </button>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="high_yield">High-Yield First</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. OVERVIEW / HOME VIEW (activeTab === "all" on desktop OR mobileSegment === "overview") */}
      {/* ========================================================================= */}
      {/* 6. PRIMARY VIEW: ONE SHOT CURATED KNOWLEDGE BANK */}
      {/* ========================================================================= */}
      {(activeTab === "all" ||
        activeTab === "pearls" ||
        activeTab === "questions" ||
        activeTab === "images" ||
        activeTab === "videos" ||
        activeTab === "tips" ||
        activeTab === "notices" ||
        (mobileSegment !== "saved" && activeTab !== "saved" && activeTab !== "sources" && activeTab !== "debugger" && activeTab !== "cross_checks")) && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section Sub-Header with Category & High-Yield Indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-stone-200/80">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>
                  {activeTab === "pearls"
                    ? "Exam Pearls"
                    : activeTab === "questions"
                    ? "Clinical Questions"
                    : activeTab === "images"
                    ? "Image Spotters"
                    : activeTab === "videos"
                    ? "Clinical Videos"
                    : activeTab === "tips"
                    ? "Rapid Clinical Tips"
                    : activeTab === "notices"
                    ? "Official Bulletins"
                    : "ONE SHOT Curated Knowledge Bank"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/[0.08] text-emerald-800 border border-emerald-500/20">
                  {highYieldOnly ? "HIGH YIELD ONLY" : "HIGH YIELD ≥ 75"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-slate-600 font-mono font-bold">
                  {filteredCuratedItems.length} {filteredCuratedItems.length === 1 ? "Item" : "Items"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === "pearls"
                  ? "High-yield clinical takeaways, gold standards, and diagnostic criteria filtered for rapid recall."
                  : activeTab === "questions"
                  ? "PYQs and clinical scenario questions with verified answers and distractor analysis."
                  : activeTab === "images"
                  ? "High-yield image-based spotters, histopathology slides, and radiological findings."
                  : activeTab === "videos"
                  ? "Clinical examination clips, procedural animations, and sign demonstrations."
                  : activeTab === "tips"
                  ? "Rapid clinical mnemonics, formula reminders, and exam day traps."
                  : activeTab === "notices"
                  ? "Official NBEMS guidelines, exam dates, and informational announcements."
                  : "Noise-filtered clinical pearls, PYQs, and image spotters verified across your subscribed channels."}
              </p>
            </div>

            {/* Quick reset if filters active */}
            {(searchQuery || selectedSubject !== "all" || selectedChannelId !== "all" || highYieldOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubject("all");
                  setSelectedChannelId("all");
                  setHighYieldOnly(false);
                  setSortBy("newest");
                }}
                className="text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoadingFeed && curatedItems.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl sm:rounded-3xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-2xs animate-pulse space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 bg-stone-200 rounded-full" />
                    <div className="h-4 w-16 bg-stone-100 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-stone-200 rounded" />
                  <div className="h-16 w-full bg-stone-100 rounded-xl" />
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <div className="h-3 w-28 bg-stone-100 rounded" />
                    <div className="h-7 w-16 bg-stone-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCuratedItems.length === 0 ? (
            /* Empty State */
            !isConnected && curatedCounts.totalCurated === 0 ? (
              <TelegramEmptyState
                onConnect={() => {
                  setAuthMethod("qr");
                  setAuthStep("phone");
                  setAuthError(null);
                  setIsConnectModalOpen(true);
                }}
              />
            ) : (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-2xs">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/[0.08] flex items-center justify-center border border-blue-500/20 text-[#007AFF]">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  Your Knowledge Bank is clean.
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery || selectedSubject !== "all" || selectedChannelId !== "all" || highYieldOnly
                    ? "No curated items match your active search or subject filters."
                    : "No items have been curated into this category yet. Click 'Sync Feed' to scan your monitored channels and curate high-yield educational material."}
                </p>
                {(searchQuery || selectedSubject !== "all" || selectedChannelId !== "all" || highYieldOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSubject("all");
                      setSelectedChannelId("all");
                      setHighYieldOnly(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/[0.08] text-[#007AFF] hover:bg-blue-500/15 border border-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )
          ) : (
            /* Canonical Knowledge Cards Grid */
            <>
              <TelegramKnowledgeCards
                items={filteredCuratedItems}
                savedItemIds={savedItemIdsSet}
                onToggleSave={handleToggleSaveCanonicalItem}
                onOpenImageZoom={(url) => setZoomedImageUrl(url)}
                selectedAnswers={userSelections}
                onSelectOption={handleSelectMCQOptionFromCard}
                onAddToErrorNotebook={onAddToErrorNotebook}
                onSaveAsPearl={onSaveAsPearl}
              />

              {/* Server-side Pagination / Load More */}
              {hasMorePages && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const nextPage = feedPage + 1;
                      fetchFeed(nextPage);
                    }}
                    disabled={isLoadingFeed}
                    className="px-5 py-2.5 rounded-full bg-white border border-slate-200/80 hover:bg-slate-50 text-[#007AFF] text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isLoadingFeed ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    <span>Load More Curated Content</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Recently Added Subjects & Quick Actions (Curated Feed "all" tab) */}
          {activeTab === "all" && (
            <div className="space-y-8 pt-4">
              <TelegramSubjectCollections
                subjectCounts={subjectCounts}
                selectedSubject={selectedSubject}
                onSelectSubject={(subjectId) => {
                  setSelectedSubject(subjectId);
                  setActiveTab("all");
                  setMobileSegment("browse");
                }}
              />

              <TelegramQuickActions
                onSearchFocus={handleSearchFocus}
                onGoToSaved={() => {
                  setActiveTab("saved");
                  setMobileSegment("saved");
                }}
                onGoToCrossChecks={() => {
                  setActiveTab("cross_checks");
                  setMobileSegment("browse");
                }}
                onGoToSources={() => {
                  setActiveTab("sources");
                  setMobileSegment("browse");
                  fetchSources();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW S: HIGH-YIELD SAVED VAULT (Dedicated Bookmark System) */}
      {/* ========================================================================= */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          {/* Saved Vault Filter & Stats Bar */}
          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/50 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-lg text-slate-900">
                    High-Yield Saved Vault ({savedItems.length} Items)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your personalized, high-yield FMGE collection organized with custom notes and tags.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Content Type Filter */}
                <div className="flex items-center bg-white rounded-full border border-slate-200 p-1 text-xs">
                  {["all", "question", "pearl", "tip", "notice"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSavedFilterType(t)}
                      className={`px-3 py-1 rounded-full font-bold capitalize transition-all cursor-pointer ${
                        savedFilterType === t
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {t === "all" ? "All" : t === "question" ? "MCQs" : t + "s"}
                    </button>
                  ))}
                </div>

                {/* Subject Selector */}
                <select
                  value={savedFilterSubject}
                  onChange={(e) => setSavedFilterSubject(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Subjects</option>
                  {FMGE_SUBJECTS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Saved Items List */}
          {filteredSavedItems.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-xl p-12 text-center space-y-3 shadow-[0_8px_30px_rgba(0,107,99,0.04)]">
              <Star className="h-10 w-10 text-amber-400 mx-auto" />
              <h3 className="font-bold text-base text-slate-900">Your Saved Vault is Empty.</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Click the <strong>Save to Vault (Star)</strong> button on any clinical MCQ, image-based question, exam notice, or medical pearl to organize your high-yield revision list here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSavedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5 hover:border-amber-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Subject Badge & Type */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 uppercase">
                          {item.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                          {item.itemType}
                        </span>
                        {item.tags && item.tags.map((tag: string, tidx: number) => (
                          <span key={tidx} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.sourceChannel}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>

                    {/* Media Preview if attached */}
                    {item.mediaUrl && (
                      <div
                        className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-56 cursor-pointer"
                        onClick={() => setZoomedImageUrl(item.mediaUrl)}
                      >
                        {item.mediaType === "VIDEO" ? (
                          <video src={item.mediaUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line break-words min-w-0">
                      {item.content}
                    </p>

                    {/* MCQ Options (if saved question) */}
                    {item.options && item.options.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="grid grid-cols-1 gap-1.5">
                          {item.options.map((opt: any) => {
                            const isCorrect = opt.key.toUpperCase() === (item.correctAnswer || "").toUpperCase();
                            return (
                              <div
                                key={opt.key}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                  isCorrect
                                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                <span className="min-w-0 flex-1 break-words"><strong className="font-mono">{opt.key})</strong> {opt.text}</span>
                                {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1.5" />}
                              </div>
                            );
                          })}
                        </div>
                        {item.explanation && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                            <strong className="text-slate-900">Explanation:</strong> {item.explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Student Custom Notes */}
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-amber-900 flex items-center gap-1">
                          <Edit3 className="h-3 w-3" /> My Student Note:
                        </span>
                        {editingNoteId !== item.id && (
                          <button
                            onClick={() => {
                              setEditingNoteId(item.id);
                              setStudentNoteInput(item.studentNotes || "");
                            }}
                            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 cursor-pointer underline"
                          >
                            {item.studentNotes ? "Edit" : "+ Add Note"}
                          </button>
                        )}
                      </div>

                      {editingNoteId === item.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={studentNoteInput}
                            onChange={(e) => setStudentNoteInput(e.target.value)}
                            placeholder="Add your mnemonic, memory hook, or exam alert..."
                            className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-900 focus:outline-none"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateSavedNotes(item.id, studentNoteInput)}
                              className="px-3 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-950 leading-relaxed italic">
                          {item.studentNotes || "No notes attached yet. Tap '+ Add Note' to write your personal memory hook."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSaveAsPearl?.({
                            title: item.title,
                            takeaway: item.content,
                            subject: item.subject.toLowerCase(),
                            topic: "Saved Telegram Vault",
                            isBookmarked: true,
                            tags: item.tags || ["Telegram"],
                          } as any);
                          confetti({ particleCount: 20, spread: 45 });
                        }}
                        className="px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Export to Medical Pearls Vault"
                      >
                        <Bookmark className="h-3.5 w-3.5" /> To Pearls Vault
                      </button>

                      <button
                        onClick={() => {
                          onAddToErrorNotebook?.({
                            subjectId: item.subject.toLowerCase().replace(/[^a-z]/g, ""),
                            topicId: "telegram-saved",
                            topic: item.title,
                            questionGist: item.content,
                            myMistake: "Saved review card",
                            correctConcept: item.explanation || item.content,
                            isReviewed: false,
                          });
                          confetti({ particleCount: 20, spread: 45 });
                        }}
                        className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Export to Error Notebook"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> To Error Vault
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteSavedItem(item.id, item.itemId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove from Saved Vault"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
      {(activeTab === "sources" || (mobileSegment === "browse" && sources.length > 0)) && (
        <div className={`rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 ${activeTab !== "sources" ? "sm:hidden" : ""}`}>
          <div className="sm:hidden flex items-center justify-between pb-1 border-b border-stone-200">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Telegram Sources ({sources.length})
            </h3>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">
                Telegram Sources ({sources.length} Discovered • {workerHealth.activeSourcesCount} Monitored)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select exactly which channels and groups the persistent cloud worker should monitor. (Starts with 0 selected).
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search dialogs..."
                value={sourceSearchQuery}
                onChange={(e) => {
                  setSourceSearchQuery(e.target.value);
                  fetchSources(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15 focus:outline-none transition-all shadow-xs"
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
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Telegram Database
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW D: AI CROSS-CHECKS */}
      {/* ========================================================================= */}
      {(activeTab === "cross_checks" || (mobileSegment === "browse" && filteredCrossChecks.length > 0)) && (
        <div className={`space-y-4 ${activeTab !== "cross_checks" ? "sm:hidden" : ""}`}>
          <div className="sm:hidden flex items-center justify-between pt-4 pb-1 border-b border-stone-200">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              AI Cross-Checks ({filteredCrossChecks.length})
            </h3>
          </div>
          {filteredCrossChecks.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 tracking-tight">
                {crossChecks.length === 0 ? "No AI Cross-Checks Ingested Yet" : "No Cross-Checks Match Your Filter"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Every clinical question ingested from Telegram is authoritatively solved and audited by Gemini AI to catch disputed answers and exam traps.
              </p>
            </div>
          ) : (
            filteredCrossChecks.map((cc) => {
              const q = questions.find((item) => item.id === cc.questionId);
              const isTrap = cc.agreementStatus === "DISAGREED" || cc.agreementStatus === "DISPUTED_TRAP";
              return (
                <div key={cc.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isTrap
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}>
                        {isTrap ? "DISPUTED TRAP / CONFLICT" : "AI VERIFIED & AGREED"}
                      </span>
                      {q && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {q.subject}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Telegram: <strong className="text-slate-900">Option {cc.originalAnswer}</strong> &rarr; Gemini AI: <strong className="text-purple-700">Option {cc.aiAnswer}</strong>
                    </span>
                  </div>

                  {q && (
                    <div className="text-xs font-semibold text-slate-900 leading-snug p-3 bg-slate-50/70 rounded-2xl border border-slate-200/60">
                      {q.questionText}
                    </div>
                  )}

                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isTrap ? "bg-amber-50/90 border border-amber-200 text-amber-950" : "bg-slate-50 border border-slate-200 text-slate-700"
                  }`}>
                    <div className="font-bold mb-1 text-[11px] uppercase tracking-wider text-slate-500">
                      Medical Audit & Clinical Rationale:
                    </div>
                    {cc.reason}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW E: SOURCE LIBRARY & RAW INGESTION AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === "debugger" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>Source Channel Library &amp; Ingestion Audit Trail</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                  {rawMessages.length || messages.length} Archived Posts
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Every Telegram post from your monitored sources is immutably archived. The ONE SHOT FMGE AI filter purges noise, commercial promotions, and duplicates before material enters the Curated Bank.
              </p>
            </div>

            {/* State Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: "ALL", label: "All Posts", count: rawMessages.length || messages.length },
                {
                  key: "CURATED",
                  label: "Curated",
                  count: (rawMessages.length > 0 ? rawMessages : messages).filter(
                    (m: any) => m.processingState === "CURATED" || m.status === "PROCESSED" || m.status === "CURATED"
                  ).length,
                  activeColor: "bg-emerald-700 text-white",
                },
                {
                  key: "PROMOTIONAL",
                  label: "Promotional",
                  count: (rawMessages.length > 0 ? rawMessages : messages).filter(
                    (m: any) => m.processingState === "PROMOTIONAL" || m.status === "PROMOTIONAL"
                  ).length,
                  activeColor: "bg-rose-700 text-white",
                },
                {
                  key: "DUPLICATE",
                  label: "Duplicates",
                  count: (rawMessages.length > 0 ? rawMessages : messages).filter(
                    (m: any) => m.processingState === "DUPLICATE" || m.status === "DUPLICATE"
                  ).length,
                  activeColor: "bg-purple-700 text-white",
                },
                {
                  key: "LOW_YIELD",
                  label: "Low Yield",
                  count: (rawMessages.length > 0 ? rawMessages : messages).filter(
                    (m: any) => m.processingState === "LOW_YIELD" || m.status === "LOW_YIELD"
                  ).length,
                  activeColor: "bg-amber-700 text-white",
                },
                {
                  key: "FAILED",
                  label: "Failed",
                  count: (rawMessages.length > 0 ? rawMessages : messages).filter(
                    (m: any) => m.processingState === "FAILED" || m.status === "FAILED"
                  ).length,
                  activeColor: "bg-slate-700 text-white",
                },
              ].map((chip) => {
                const isSelected = rawStateFilter === chip.key;
                return (
                  <button
                    key={chip.key}
                    onClick={() => setRawStateFilter(chip.key as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? chip.activeColor || "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-white text-slate-600"
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Scanned</div>
              <div className="font-mono text-xl font-bold text-slate-900 mt-1">
                {rawMessages.length || messages.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Direct telegram posts</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Promotional Filtered</div>
              <div className="font-mono text-xl font-bold text-rose-900 mt-1">
                {(rawMessages.length > 0 ? rawMessages : messages).filter(
                  (m: any) => m.processingState === "PROMOTIONAL" || m.status === "PROMOTIONAL"
                ).length}
              </div>
              <div className="text-[10px] text-rose-600/80 mt-0.5">Spam / course ads removed</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Duplicates Merged</div>
              <div className="font-mono text-xl font-bold text-purple-900 mt-1">
                {(rawMessages.length > 0 ? rawMessages : messages).filter(
                  (m: any) => m.processingState === "DUPLICATE" || m.status === "DUPLICATE"
                ).length}
              </div>
              <div className="text-[10px] text-purple-600/80 mt-0.5">Cross-channel reposts</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Curated Bank Active</div>
              <div className="font-mono text-xl font-bold text-emerald-950 mt-1">
                {curatedCounts.totalCurated || curatedItems.length || canonicalItems.length}
              </div>
              <div className="text-[10px] text-emerald-700/80 mt-0.5">FMGE high-yield items</div>
            </div>
          </div>

          {/* Raw Messages Table */}
          {filteredRawMessages.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="text-sm font-bold text-slate-700">No Raw Messages Match Filter</div>
              <p className="text-xs text-slate-400">
                Try switching the status chip filter to &quot;All Posts&quot; or clearing your search term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5 font-bold">Msg ID</th>
                    <th className="py-3 px-3.5 font-bold">Source Channel</th>
                    <th className="py-3 px-3.5 font-bold">Time</th>
                    <th className="py-3 px-3.5 font-bold">Content Snippet</th>
                    <th className="py-3 px-3.5 font-bold">Media</th>
                    <th className="py-3 px-3.5 font-bold">Pipeline Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] bg-white">
                  {filteredRawMessages.map((m: any) => {
                    const status = m.processingState || m.status;
                    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                    let label = status;
                    let reason = m.reason || m.errorMessage || (m.filterReason ? `Filtered: ${m.filterReason}` : null);

                    if (status === "CURATED" || status === "PROCESSED") {
                      badgeClass = "bg-emerald-500/[0.08] text-emerald-800 border-emerald-500/20";
                      label = "Curated High-Yield";
                    } else if (status === "PROMOTIONAL") {
                      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                      label = "Promotional Filtered";
                      if (!reason) reason = "Promotional offer / commercial spam";
                    } else if (status === "DUPLICATE") {
                      badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                      label = "Duplicate Merged";
                      if (!reason) reason = "Merged into canonical item";
                    } else if (status === "LOW_YIELD") {
                      badgeClass = "bg-amber-50 text-amber-800 border-amber-200";
                      label = "Low Yield (<60)";
                      if (!reason) reason = "Quality score below exam threshold";
                    } else if (status === "FAILED") {
                      badgeClass = "bg-red-50 text-red-700 border-red-200";
                      label = "Extraction Failed";
                    }

                    const channelTitle = m.sourceTitle || m.sourceId;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                          #{m.telegramMessageId}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 max-w-[160px] truncate">
                          <span title={channelTitle}>{channelTitle}</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-400 text-[10px] whitespace-nowrap">
                          {m.messageDate ? new Date(m.messageDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700 max-w-sm text-xs">
                          <div className="line-clamp-2 leading-relaxed">
                            {m.rawText || (m.mediaUrls?.length > 0 ? "[Media Attachment]" : "[Non-text telegram entity]")}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-[10px] whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {m.mediaType || "NONE"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 space-y-0.5">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                              {label}
                            </span>
                          </div>
                          {reason && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]" title={reason}>
                              {reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ========================================================================= */}
      {/* AUTHENTICATION MODAL: QR CODE (Default) + PHONE NUMBER (Fallback) */}
      {/* ========================================================================= */}
      {isConnectModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/90 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-slate-700" />
                <h3 className="font-bold text-base text-slate-900">
                  Telegram User Authentication
                </h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 shadow-2xs backdrop-blur-sm transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
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
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  <p className="font-bold text-slate-900">How to Login with QR Code:</p>
                  <ol className="text-left list-decimal list-inside space-y-1 text-slate-500 max-w-xs mx-auto text-[11px]">
                    <li>Open <strong>Telegram</strong> on your phone</li>
                    <li>Go to <strong>Settings</strong> → <strong>Devices</strong></li>
                    <li>Tap <strong>Link Desktop Device</strong></li>
                    <li>Point your camera at this QR code</li>
                  </ol>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleGenerateQr}
                    disabled={isQrLoading}
                    className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isQrLoading ? "animate-spin" : ""}`} />
                    Refresh QR Code
                  </button>
                  <button
                    onClick={() => {
                      setAuthMethod("phone");
                      setAuthError(null);
                    }}
                    className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all cursor-pointer"
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
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Phone Number (E.164 International Format)
                    </label>
                    {livePhoneValidation?.isValid && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {livePhoneValidation.countryCode} {livePhoneValidation.nationalNumber ? `(${livePhoneValidation.nationalNumber.length} digits)` : ""}
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
                  className="w-full py-2.5 bg-slate-900 text-white rounded-full font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? "Connecting to Telegram MTProto..." : "Send Verification Code"}
                </button>
              </form>
            )}

            {/* METHOD 2: VERIFICATION CODE STEP 2 */}
            {authStep === "code" && (
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
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
                  className="w-full py-2.5 bg-slate-900 text-white rounded-full font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            )}

            {/* 2FA PASSWORD STEP */}
            {authStep === "2fa" && (
              <form onSubmit={handleVerify2FA} className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
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
                  className="w-full py-2.5 bg-slate-900 text-white rounded-full font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading ? "Authenticating..." : "Complete 2FA Login"}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* Manage Connected Telegram Account Modal */}
      {isManageModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/90 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Telegram Account Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 shadow-2xs backdrop-blur-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                <div className="text-slate-400 font-medium">Logged in as:</div>
                <div className="font-bold text-sm text-slate-900">{userProfile?.firstName || "Doctor"}</div>
                <div className="text-slate-500 font-mono">{userProfile?.phone}</div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live MTProto Ingestion Active
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsManageModalOpen(false);
                    handleManualSyncNow();
                  }}
                  disabled={isManualSyncing}
                  className="w-full py-2.5 rounded-xl bg-blue-500/[0.08] hover:bg-blue-500/15 text-[#007AFF] border border-blue-500/20 font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isManualSyncing ? "animate-spin" : ""}`} />
                  {isManualSyncing ? "Syncing MTProto..." : "Auto-Sync Channels Now"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsManageModalOpen(false);
                    handleReEnrichWithGemini();
                  }}
                  disabled={isReEnriching}
                  className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className={`w-4 h-4 ${isReEnriching ? "animate-spin" : ""}`} />
                  {isReEnriching ? "Verifying..." : "Clinical Cross-Check (Gemini)"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsManageModalOpen(false);
                    handleDisconnect();
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Disconnect Telegram Account
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Zoomed Medical Image Modal */}
      {zoomedImageUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fadeIn"
            onClick={() => setZoomedImageUrl(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl p-2 border border-slate-700 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomedImageUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={zoomedImageUrl}
                alt="Zoomed Medical Attachment"
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
