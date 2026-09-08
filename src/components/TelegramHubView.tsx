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
  Zap,
  Sparkles,
  Send,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
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

  // 2. Data Feed State
  const [questions, setQuestions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [pearls, setPearls] = useState<any[]>([]);
  const [crossChecks, setCrossChecks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);

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

          if (Array.isArray(data.savedItems)) {
            setSavedItems(data.savedItems);
            const bookmarkMap: Record<string, boolean> = {};
            data.savedItems.forEach((si: any) => {
              bookmarkMap[si.itemId] = true;
            });
            setSavedBookmarkIds(bookmarkMap);
          }
        }
      }
    } catch (_) {}
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
    setSyncBannerNotice("Connecting to Telegram MTProto channels...");
    try {
      const res = await fetch("/api/telegram/cloud/sync-now", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSyncBannerNotice(
            `⚡ Auto-Sync Complete! Monitored ${data.monitoredSourcesCount} channels. Ingested ${data.newMessagesCount} new messages (${data.newQuestionsCount} new clinical MCQs).`
          );
          await fetchFeed();
          await fetchStatus();
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.25 } });
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
      setTimeout(() => setSyncBannerNotice(null), 7000);
    }
  };

  const handleReEnrichWithGemini = async () => {
    setIsReEnriching(true);
    setSyncBannerNotice("🧠 Gemini AI is verifying clinical questions, option distractors, and exam pearls...");
    try {
      const res = await fetch("/api/telegram/cloud/re-enrich", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncBannerNotice(`🎉 Gemini verified & updated ${data.enrichedCount || 0} questions & exam pearls!`);
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

  // Filtered Questions with Subject, Tab, and Channel Selection
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

    // Questions & media questions
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

    // Tips
    tips.slice(0, 4).forEach((t) => {
      list.push({
        id: t.id,
        type: "tip",
        title: t.title || "Clinical Tip",
        stem: t.cleanedText || t.originalText,
        subject: t.subject || "Review Tip",
        tags: ["Tip"],
        createdAt: t.createdAt || new Date().toISOString(),
        originalData: t,
        isSaved: savedItemIdsSet.has(t.id),
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [questions, pearls, tips, savedItemIdsSet]);

  // Dynamic real subject counts from actual questions, pearls, and tips
  const subjectCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
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
  }, [questions, pearls, tips]);

  // Mapping of selected MCQ answers for card solving
  const selectedMcqAnswers = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach((q) => {
      const key = userSelections[q.id];
      if (key && q.options) {
        const idx = q.options.findIndex((o: any) => o.key.toUpperCase() === key.toUpperCase());
        if (idx !== -1) map[q.id] = idx;
      }
    });
    return map;
  }, [questions, userSelections]);

  const handleSelectMCQOption = (questionId: string, optionIndex: number) => {
    const q = questions.find((item) => item.id === questionId);
    if (!q) return;
    const optKey = q.options?.[optionIndex]?.key || String.fromCharCode(65 + optionIndex);
    handleSelectOption(q, optKey);
  };

  const handleToggleUnifiedItem = (item: UnifiedKnowledgeItem) => {
    let itemType: "question" | "notice" | "tip" | "pearl" | "media" = "question";
    if (item.type === "pearl") itemType = "pearl";
    else if (item.type === "tip") itemType = "tip";
    else if (item.type === "notice") itemType = "notice";
    else if (item.type === "image" || item.type === "video") itemType = "media";

    const q = item.originalData;
    handleToggleSaveItem({
      itemId: item.id,
      itemType,
      subject: item.subject || "General Medicine",
      title: item.title,
      content: item.stem || item.title,
      mediaUrl: item.imageUrl || item.videoUrl,
      mediaType: item.imageUrl ? "IMAGE" : item.videoUrl ? "VIDEO" : "NONE",
      options: q?.options,
      correctAnswer: q?.correctAnswer,
      explanation: q?.explanation,
      tags: item.tags,
      sourceChannel: q?.sourceChannel,
    });
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8 animate-fadeIn pb-56 sm:pb-40 lg:pb-16 font-['Plus_Jakarta_Sans'] min-w-0 max-w-full overflow-x-clip">
      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & EDITORIAL HERO HEADER */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider font-mono">
            <span className="text-stone-500">UTILITIES</span>
            <span className="text-stone-400">•</span>
            <span className="text-[#006B63] font-bold">COMMUNITY KNOWLEDGE HUB</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-teal-50 text-teal-800 border border-teal-200">
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-teal-500'}`} />
              {isConnected ? 'MTProto Live Synced' : 'Community Feed Active'}
            </span>
          </div>
        </div>

        {/* Hero Header Card with Motion & Visual Animations */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-[#EFF8FC] via-[#FAFDFE] via-45% to-[#E6F3FA] p-4 sm:px-6 sm:py-3.5 shadow-xs"
        >
          {/* Dynamic Animated Ambient Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* Luminous system theme top border shimmer track */}
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/25 to-transparent" />
              <motion.div
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.0 }}
                className="w-48 sm:w-72 h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_14px_#38bdf8]"
              />
            </div>

            {/* Subtle bottom border gradient luster */}
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />

            {/* Soft glowing corner radial gradient orbs with breathing motion */}
            <motion.div
              animate={{
                scale: [1, 1.18, 1],
                opacity: [0.35, 0.6, 0.35],
                x: [0, 16, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-sky-400/35 via-teal-200/25 to-transparent blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.2, 0.4, 0.2],
                y: [0, -10, 0],
              }}
              transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-16 -left-12 h-60 w-60 rounded-full bg-gradient-to-tr from-cyan-300/25 via-sky-100/20 to-transparent blur-3xl"
            />

            {/* Subtle Community Matrix Grid */}
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.035] text-sky-950 pointer-events-none select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="tg-hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.75" />
                  <circle cx="28" cy="28" r="0.75" fill="currentColor" opacity="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#tg-hero-grid)" />
            </svg>

          {/* Premium Global Satellite Observatory & Cosmic Telemetry Artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[520px] overflow-hidden opacity-45 sm:opacity-60 md:opacity-[0.72] select-none pointer-events-none block">
            <svg viewBox="0 0 520 145" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <linearGradient id="tg-earth-limb" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0369A1" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#0284C7" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="tg-dish-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#BAE6FD" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="tg-satellite-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
                <radialGradient id="tg-atmosphere-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#0284C7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Distant Cosmos Nebula Glow */}
              <motion.circle
                cx="420"
                cy="50"
                r="65"
                fill="url(#tg-atmosphere-glow)"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Twinkling Constellation Stars */}
              <g fill="#E0F2FE">
                <motion.circle cx="240" cy="25" r="1.4" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.8, repeat: Infinity }} />
                <motion.circle cx="285" cy="18" r="1.2" animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 3.4, repeat: Infinity, delay: 0.6 }} />
                <motion.circle cx="330" cy="32" r="1.5" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.2, repeat: Infinity, delay: 1.1 }} />
                <motion.circle cx="470" cy="22" r="1.3" animate={{ opacity: [0.2, 0.85, 0.2] }} transition={{ duration: 3.1, repeat: Infinity, delay: 0.4 }} />
                <motion.circle cx="505" cy="38" r="1.1" animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }} />
                {/* Subtle Constellation Vector Links */}
                <line x1="240" y1="25" x2="285" y2="18" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
                <line x1="285" y1="18" x2="330" y2="32" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
              </g>

              {/* ═══ 1. CURVING PLANET EARTH ATMOSPHERIC LIMB ═══ */}
              <path
                d="M 120 145 C 240 105, 380 92, 520 102 L 520 145 Z"
                fill="url(#tg-earth-limb)"
              />
              {/* Luminous Atmospheric Edge Aura */}
              <path
                d="M 120 145 C 240 105, 380 92, 520 102"
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M 120 145 C 240 105, 380 92, 520 102"
                stroke="#7DD3FC"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Terrestrial City Light Nodes along Horizon */}
              <circle cx="260" cy="115" r="1.8" fill="#FDE047" opacity="0.8" />
              <circle cx="340" cy="103" r="2.0" fill="#FDE047" opacity="0.9" />
              <circle cx="410" cy="101" r="2.2" fill="#FDE047" opacity="0.85" />
              <circle cx="460" cy="106" r="1.8" fill="#FDE047" opacity="0.75" />

              {/* ═══ 2. HILLTOP OBSERVATORY DOME & PARABOLIC DISH ═══ */}
              {/* Observatory Hill Silhouette */}
              <path
                d="M 320 145 C 360 110, 420 105, 480 145 Z"
                fill="#0F172A"
                opacity="0.9"
              />

              {/* Classical Astronomical Observatory Dome at (380, 112) */}
              <g transform="translate(380, 112)">
                {/* Cylindrical Base */}
                <rect x="-14" y="0" width="28" height="16" fill="#1E293B" stroke="#38BDF8" strokeWidth="0.8" />
                {/* Hemispherical Dome */}
                <path d="M -14 0 A 14 14 0 0 1 14 0 Z" fill="#0284C7" stroke="#BAE6FD" strokeWidth="0.8" />
                {/* Telescopic Observation Slit */}
                <rect x="-3" y="-12" width="6" height="12" fill="#0F172A" />
                <motion.line
                  x1="0"
                  y1="-10"
                  x2="0"
                  y2="0"
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              </g>

              {/* Large Deep-Space Parabolic Dish Antenna at (435, 105) */}
              <g transform="translate(435, 105) rotate(-28)">
                {/* Pylon Mount Stanchion */}
                <path d="M -4 25 L 4 25 L 2 5 L -2 5 Z" fill="#334155" />
                {/* Parabolic Reflector Dish Shell */}
                <path
                  d="M -26 0 C -18 16, 18 16, 26 0 C 18 6, -18 6, -26 0 Z"
                  fill="url(#tg-dish-grad)"
                  stroke="#0284C7"
                  strokeWidth="1"
                />
                {/* Central Sub-reflector Feed Horn */}
                <line x1="0" y1="8" x2="0" y2="-12" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="0" cy="-12" r="3" fill="#38BDF8" />

                {/* Radiating Microwave Transmission Wavefronts */}
                <motion.path
                  d="M -16 -18 C -8 -26, 8 -26, 16 -18"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  animate={{ scale: [1, 2.2], opacity: [0.9, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.path
                  d="M -16 -18 C -8 -26, 8 -26, 16 -18"
                  stroke="#7DD3FC"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                  animate={{ scale: [1, 2.2], opacity: [0.9, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
                />
              </g>

              {/* ═══ 3. GLIDING ORBITAL SATELLITE WITH SOLAR PANELS ═══ */}
              <motion.g
                animate={{
                  x: [0, 220],
                  y: [0, -16],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
              >
                <g transform="translate(180, 42) rotate(15)">
                  {/* Central Satellite Body Bus */}
                  <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.8" />
                  {/* Left Solar Panel Array Wing */}
                  <rect x="-26" y="-6" width="16" height="12" rx="1" fill="#0369A1" stroke="#38BDF8" strokeWidth="0.7" />
                  <line x1="-18" y1="-6" x2="-18" y2="6" stroke="#38BDF8" strokeWidth="0.5" />
                  <line x1="-10" y1="-1" x2="-26" y2="-1" stroke="#38BDF8" strokeWidth="0.5" />
                  <line x1="-10" y1="2" x2="-26" y2="2" stroke="#38BDF8" strokeWidth="0.5" />
                  {/* Right Solar Panel Array Wing */}
                  <rect x="10" y="-6" width="16" height="12" rx="1" fill="#0369A1" stroke="#38BDF8" strokeWidth="0.7" />
                  <line x1="18" y1="-6" x2="18" y2="6" stroke="#38BDF8" strokeWidth="0.5" />
                  <line x1="10" y1="-1" x2="26" y2="-1" stroke="#38BDF8" strokeWidth="0.5" />
                  <line x1="10" y1="2" x2="26" y2="2" stroke="#38BDF8" strokeWidth="0.5" />
                  {/* Telemetry Sensor Antenna */}
                  <line x1="0" y1="5" x2="0" y2="12" stroke="#38BDF8" strokeWidth="1" />
                  <circle cx="0" cy="12" r="1.5" fill="#34D399" />
                  {/* Pulsing Beacon Light */}
                  <motion.circle
                    cx="0"
                    cy="0"
                    r="3.5"
                    fill="#38BDF8"
                    animate={{ scale: [1, 1.8], opacity: [0.85, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  />
                </g>
              </motion.g>
            </svg>
          </div>
        </div>

          {/* Header Content Body */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1.5 max-w-2xl">
              {/* Insignia + Title Row */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#006B63] text-white shadow-md shadow-sky-950/15 shrink-0">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-[2px] rounded-2xl bg-gradient-to-tr from-sky-400/40 via-teal-300/20 to-sky-500/50 blur-[2px] -z-10"
                  />
                  <Send className="h-5 w-5 text-white rotate-[-20deg]" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[#0284C7] text-[10px] sm:text-[11px] font-bold font-mono tracking-wide">
                    <span>COMMUNITY INGESTION ENGINE</span>
                    <span className="text-sky-300">•</span>
                    <span className="hidden sm:inline">VERIFIED FMGE CHANNELS</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-slate-900 tracking-tight font-['Outfit'] leading-snug">
                    Telegram Knowledge Bank
                  </h1>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-xl line-clamp-1 sm:line-clamp-none">
                Clinical polls, high-yield image spotters, and discussion pearls ingested from verified FMGE channels.
              </p>

              {/* Quick Metrics Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                  <span className="text-slate-400">Questions:</span>
                  <span className="font-bold text-slate-900">{questions.length}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                  <span className="text-slate-400">Spotters:</span>
                  <span className="font-bold text-teal-700">{imageQuestions.length}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                  <span className="text-slate-400">Pearls:</span>
                  <span className="font-bold text-indigo-700">{pearls.length}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/85 border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-2xs">
                  <span className="text-slate-400">Saved:</span>
                  <span className="font-bold text-emerald-700">{savedItems.length}</span>
                </div>
              </div>
            </div>

            {/* Right Action & Editorial Quote Card */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSyncNow}
                  disabled={isManualSyncing}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#006B63] hover:bg-[#00524c] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
                  <span>{isManualSyncing ? 'Syncing...' : 'Sync Feed'}</span>
                </button>

                {!isConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('qr');
                      setAuthStep('phone');
                      setAuthError(null);
                      setIsConnectModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-teal-200 text-[#006B63] hover:bg-teal-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Connect MTProto</span>
                  </button>
                )}
              </div>

              <div className="bg-white/85 border border-teal-200/70 rounded-xl px-3 py-1.5 flex items-center gap-2 max-w-sm shadow-2xs">
                <span className="text-xs font-serif text-[#006B63] font-bold select-none shrink-0">“</span>
                <p className="text-[11px] text-slate-700 font-medium leading-tight">
                  Good resources stay with you.
                </p>
              </div>
            </div>
          </div>
        </motion.header>
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
            <Zap className="h-4 w-4 text-sky-600 shrink-0" />
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
        totalItems={questions.length + pearls.length + tips.length + notices.length}
        questionCount={questions.length}
        imageCount={imageQuestions.length}
        videoCount={videoQuestions.length}
        pearlCount={pearls.length}
        channelCount={workerHealth.activeSourcesCount}
      />

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
              { id: "all", label: "All", count: questions.length + pearls.length + tips.length + notices.length, icon: Sparkles },
              { id: "questions", label: "Questions", count: questions.length, icon: FileText },
              { id: "saved", label: "Vault", count: savedItems.length, icon: Star, highlight: true },
              { id: "images", label: "Images", count: imageQuestions.length, icon: ImageIcon },
              { id: "videos", label: "Videos", count: videoQuestions.length, icon: Video },
              { id: "tips", label: "Tips", count: tips.length, icon: Lightbulb },
              { id: "notices", label: "Notices", count: notices.length, icon: Bell },
              { id: "pearls", label: "Exam Pearls", count: pearls.length, icon: Zap },
              { id: "cross_checks", label: "AI Cross-Check", count: crossChecks.length, icon: ShieldCheck },
              { id: "sources", label: "Sources", count: workerHealth.activeSourcesCount, icon: Layers },
              { id: "debugger", label: "Raw Stream", count: messages.length, icon: Terminal },
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-[#00685f] text-white shadow-xs"
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
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search the knowledge bank by clinical stem, drug, triad, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                {/* Subject Selector */}
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
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
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="all">All Channels ({sources.length})</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.title} {src.isMonitored ? "⚡" : ""}
                    </option>
                  ))}
                </select>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. OVERVIEW / HOME VIEW (activeTab === "all" on desktop OR mobileSegment === "overview") */}
      {/* ========================================================================= */}
      {(activeTab === "all" || (mobileSegment === "overview" && activeTab !== "saved" && activeTab !== "sources" && activeTab !== "debugger")) && (
        <div className="space-y-8 animate-fadeIn">
          {/* Empty State when no questions ingested and not connected */}
          {!isConnected && questions.length === 0 ? (
            <TelegramEmptyState
              onConnect={() => {
                setAuthMethod("qr");
                setAuthStep("phone");
                setAuthError(null);
                setIsConnectModalOpen(true);
              }}
            />
          ) : (
            <>
              {/* SECTION: LATEST FROM YOUR KNOWLEDGE BANK */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                      Latest from Your Knowledge Bank
                    </h3>
                    <p className="text-xs text-slate-500">
                      High-yield content, ready for your revision.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("questions");
                      setMobileSegment("browse");
                    }}
                    className="text-xs font-semibold text-[#00685f] hover:text-[#005049] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    View All →
                  </button>
                </div>

                <TelegramKnowledgeCards
                  items={latestKnowledgeItems}
                  savedItemIds={savedItemIdsSet}
                  onToggleSave={handleToggleUnifiedItem}
                  onOpenImageZoom={(url) => setZoomedImageUrl(url)}
                  selectedAnswers={selectedMcqAnswers}
                  onSelectOption={handleSelectMCQOption}
                  onAddToErrorNotebook={onAddToErrorNotebook}
                  onSaveAsPearl={onSaveAsPearl}
                />
              </div>

              {/* SECTION: RECENTLY ADDED SUBJECTS */}
              <TelegramSubjectCollections
                subjectCounts={subjectCounts}
                selectedSubject={selectedSubject}
                onSelectSubject={(subjectId) => {
                  setSelectedSubject(subjectId);
                  setActiveTab("questions");
                  setMobileSegment("browse");
                }}
              />

              {/* SECTION: QUICK ACTIONS */}
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
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: QUESTIONS / IMAGES / VIDEOS */}
      {/* ========================================================================= */}
      {(activeTab === "questions" || activeTab === "images" || activeTab === "videos" || mobileSegment === "browse") && (
        <div className={`space-y-4 ${!(activeTab === "questions" || activeTab === "images" || activeTab === "videos") ? "sm:hidden" : ""}`}>
          {/* Mobile section header in browse mode */}
          <div className="sm:hidden flex items-center justify-between pb-1 border-b border-stone-200">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00685f]" />
              Clinical Questions ({filteredQuestions.length})
            </h3>
          </div>
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
                      <span className="text-xs font-medium text-slate-600 truncate max-w-xs min-w-0">
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
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed break-words">
                    {q.questionText}
                  </p>

                  {/* Image / Video Attachment for Question */}
                  {q.imageUrl && (
                    <div
                      className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative group max-h-72 cursor-pointer shadow-sm"
                      onClick={() => setZoomedImageUrl(q.imageUrl)}
                    >
                      <img
                        src={q.imageUrl}
                        alt={q.questionText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold font-['Outfit'] flex items-center gap-1.5 shadow-md">
                          <ZoomIn className="h-3.5 w-3.5" /> Tap to Zoom Image
                        </span>
                      </div>
                    </div>
                  )}

                  {q.videoUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black max-h-72 shadow-sm">
                      <video src={q.videoUrl} controls className="w-full h-full object-cover" />
                    </div>
                  )}

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
                              <Zap className="h-4 w-4 text-amber-600 shrink-0" />
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
                            crossCheck.agreementStatus === "DISAGREED" || crossCheck.agreementStatus === "DISPUTED_TRAP"
                              ? "bg-amber-50 border-amber-300 text-amber-950 shadow-2xs"
                              : "bg-emerald-50 border-emerald-200 text-emerald-900"
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold font-['Outfit']">
                              {crossCheck.agreementStatus === "DISAGREED" || crossCheck.agreementStatus === "DISPUTED_TRAP" ? (
                                <>
                                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span>⚠️ AI ANSWER CONFLICT: Telegram Answer ({crossCheck.originalAnswer}) vs Gemini AI ({crossCheck.aiAnswer})</span>
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

                  {/* Action Bar: Save to High-Yield Vault, Error Vault, Pearls */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          handleToggleSaveItem({
                            itemId: q.id,
                            itemType: "question",
                            subject: q.subject || "General Medicine",
                            title: q.topic || "Clinical MCQ",
                            content: q.questionText,
                            mediaUrl: q.imageUrl || q.videoUrl,
                            mediaType: q.imageUrl ? "IMAGE" : q.videoUrl ? "VIDEO" : "POLL",
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            sourceChannel: q.sourceChannel,
                            tags: ["MCQ", q.subject || "Medicine"],
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1.5 cursor-pointer ${
                          savedBookmarkIds[q.id]
                            ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${savedBookmarkIds[q.id] ? "fill-amber-500 text-amber-500" : ""}`} />
                        {savedBookmarkIds[q.id] ? "Saved in Vault" : "Save to Vault"}
                      </button>

                      <button
                        onClick={() => {
                          onAddToErrorNotebook?.({
                            subjectId: (q.subject || "medicine").toLowerCase().replace(/[^a-z]/g, ""),
                            topicId: "telegram-recall",
                            topic: q.topic || "Telegram Ingestion",
                            questionGist: q.questionText,
                            myMistake: "Telegram practice error review",
                            correctConcept: `${q.explanation} (Answer: Option ${q.correctAnswer})`,
                            isReviewed: false,
                          });
                          confetti({ particleCount: 20, spread: 45 });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Send to Error Notebook"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        To Error Vault
                      </button>

                      <button
                        onClick={() => {
                          onSaveAsPearl?.({
                            title: q.topic || "Telegram Clinical Concept",
                            takeaway: q.examPearl || q.explanation,
                            subject: q.subject || "medicine",
                            topic: q.topic || "Clinical Recall",
                            isBookmarked: true,
                            tags: ["Telegram", q.subject || "Medicine"],
                          } as any);
                          confetti({ particleCount: 25, spread: 50 });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Send to Medical Pearls Vault"
                      >
                        <Bookmark className="h-3.5 w-3.5 text-purple-600" />
                        To Pearls
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      #{q.id.slice(-6)}
                    </span>
                  </div>
                </div>
              );
            })
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
                  <h3 className="font-bold font-['Outfit'] text-lg text-slate-900">
                    High-Yield Saved Vault ({savedItems.length} Items)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your personalized, high-yield FMGE collection organized with custom notes and tags.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Content Type Filter */}
                <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 text-xs">
                  {["all", "question", "pearl", "tip", "notice"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSavedFilterType(t)}
                      className={`px-3 py-1 rounded-lg font-bold font-['Outfit'] capitalize transition-all cursor-pointer ${
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
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
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
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <Star className="h-10 w-10 text-amber-400 mx-auto" />
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">Your Saved Vault is Empty.</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Click the <strong>Save to Vault (⭐)</strong> button on any clinical MCQ, image-based question, exam notice, or medical pearl to organize your high-yield revision list here.
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-['Outfit'] bg-amber-50 text-amber-900 border border-amber-200 uppercase">
                          {item.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-['Outfit'] uppercase bg-slate-100 text-slate-700">
                          {item.itemType}
                        </span>
                        {item.tags && item.tags.map((tag: string, tidx: number) => (
                          <span key={tidx} className="px-2 py-0.5 rounded-full text-[9px] font-bold font-['Outfit'] bg-sky-50 text-sky-700 border border-sky-100">
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
                        <span className="font-bold text-[11px] font-['Outfit'] text-amber-900 flex items-center gap-1">
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
                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1 cursor-pointer"
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
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1 cursor-pointer"
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
      {/* VIEW N: OFFICIAL NOTICES */}
      {/* ========================================================================= */}
      {(activeTab === "notices" || (mobileSegment === "browse" && filteredNotices.length > 0)) && (
        <div className={`space-y-4 ${activeTab !== "notices" ? "sm:hidden" : ""}`}>
          <div className="sm:hidden flex items-center justify-between pt-4 pb-1 border-b border-stone-200">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              Official Notices ({filteredNotices.length})
            </h3>
          </div>
          {filteredNotices.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <Bell className="h-8 w-8 text-sky-500 mx-auto" />
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
                {notices.length === 0 ? "No Official Exam Notices Ingested Yet" : "No Notices Match Your Search"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official NBEMS notices, admit card announcements, and exam date bulletins posted in monitored channels will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotices.map((n) => {
                const noticeContent = n.cleanedText || n.originalText || n.content || "Official NBEMS Bulletin";
                return (
                  <div key={n.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-['Outfit'] uppercase ${
                          n.importance === "critical"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}>
                          {n.importance === "critical" ? "⚠️ CRITICAL NOTICE" : "OFFICIAL NOTICE"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {n.noticeDate ? new Date(n.noticeDate).toLocaleDateString() : "Recent"}
                        </span>
                      </div>

                      {n.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-60 cursor-pointer" onClick={() => setZoomedImageUrl(n.imageUrl)}>
                          <img src={n.imageUrl} alt="Notice document" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line break-words min-w-0">
                        {noticeContent}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 min-w-0">
                      <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px] min-w-0">
                        Source: {n.sourceChannel || "Official Channel"}
                      </span>
                      <button
                        onClick={() => handleToggleSaveItem({
                          itemId: n.id,
                          itemType: "notice",
                          subject: "Official Bulletin",
                          title: `NBE Notice - ${n.sourceChannel || "Exam"}`,
                          content: noticeContent,
                          mediaUrl: n.imageUrl,
                          mediaType: n.imageUrl ? "IMAGE" : "NONE",
                          sourceChannel: n.sourceChannel,
                          tags: ["NBE Notice", "Official"],
                        })}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1.5 cursor-pointer ${
                          savedBookmarkIds[n.id]
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${savedBookmarkIds[n.id] ? "fill-amber-500 text-amber-500" : ""}`} />
                        {savedBookmarkIds[n.id] ? "Saved" : "Save Notice"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW T: HIGH-YIELD TIPS & BULLETINS */}
      {/* ========================================================================= */}
      {(activeTab === "tips" || (mobileSegment === "browse" && filteredTips.length > 0)) && (
        <div className={`space-y-4 ${activeTab !== "tips" ? "sm:hidden" : ""}`}>
          <div className="sm:hidden flex items-center justify-between pt-4 pb-1 border-b border-stone-200">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              High-Yield Tips ({filteredTips.length})
            </h3>
          </div>
          {filteredTips.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <Lightbulb className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
                {tips.length === 0 ? "No High-Yield Tips Ingested Yet" : "No High-Yield Tips Match Your Filter"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {tips.length === 0
                  ? "Rapid review formulas, clinical mnemonics, and high-yield tips posted in monitored channels will stream here automatically."
                  : "Try clearing search or subject filter to view all ingested clinical tips."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTips.map((t) => {
                const displayText = t.cleanedText || t.originalText || t.content || t.title || "High-Yield Clinical Rapid Review Note";
                return (
                  <div key={t.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-['Outfit'] uppercase bg-amber-50 text-amber-800 border border-amber-200">
                          {t.subject || "HIGH-YIELD TIP"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Tip</span>
                      </div>

                      {t.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-60 cursor-pointer" onClick={() => setZoomedImageUrl(t.imageUrl)}>
                          <img src={t.imageUrl} alt="Tip diagram" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {t.videoUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black max-h-60">
                          <video src={t.videoUrl} controls className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed font-medium whitespace-pre-line break-words">
                        {displayText}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-slate-400 font-mono truncate max-w-[160px] min-w-0">
                        Source: {t.sourceChannel || "Monitored Channel"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleSaveItem({
                            itemId: t.id,
                            itemType: "tip",
                            subject: t.subject || "General Medicine",
                            title: `High-Yield Tip - ${t.subject || "Clinical"}`,
                            content: displayText,
                            mediaUrl: t.imageUrl || t.videoUrl,
                            mediaType: t.imageUrl ? "IMAGE" : t.videoUrl ? "VIDEO" : "NONE",
                            sourceChannel: t.sourceChannel,
                            tags: ["Tip", t.subject || "Medicine"],
                          })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1.5 cursor-pointer ${
                            savedBookmarkIds[t.id]
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <Star className={`h-3.5 w-3.5 ${savedBookmarkIds[t.id] ? "fill-amber-500 text-amber-500" : ""}`} />
                          {savedBookmarkIds[t.id] ? "Saved" : "Save to Vault"}
                        </button>

                        <button
                          onClick={() => {
                            onSaveAsPearl?.({
                              title: `Tip: ${t.subject || "Clinical"}`,
                              takeaway: displayText,
                              subject: (t.subject || "medicine").toLowerCase(),
                              topic: "Telegram Tip",
                              isBookmarked: true,
                              tags: ["Tip", t.subject || "Medicine"],
                            } as any);
                            confetti({ particleCount: 20, spread: 45 });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1 cursor-pointer"
                          title="Add to Pearls Vault"
                        >
                          <Bookmark className="h-3.5 w-3.5 text-purple-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: EXAM PEARLS */}
      {/* ========================================================================= */}
      {(activeTab === "pearls" || (mobileSegment === "browse" && filteredPearls.length > 0)) && (
        <div className={`space-y-4 ${activeTab !== "pearls" ? "sm:hidden" : ""}`}>
          <div className="sm:hidden flex items-center justify-between pt-4 pb-1 border-b border-stone-200">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              Exam Pearls ({filteredPearls.length})
            </h3>
          </div>
          {filteredPearls.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <Zap className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
                {pearls.length === 0 ? "No Exam Pearls Yet" : "No Exam Pearls Match Your Filter"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {pearls.length === 0
                  ? "High-yield clinical takeaways, gold standards, and mnemonics extracted by the system will stream here automatically."
                  : "Try adjusting your search query or subject filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPearls.map((p) => {
                const takeawayText = p.takeaway || p.content || p.title || "High-Yield Clinical Takeaway";
                return (
                  <div key={p.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-['Outfit'] bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          {p.subject || "MEDICINE"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Exam Pearl • Auto-Saved</span>
                      </div>

                      {p.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-60 cursor-pointer" onClick={() => setZoomedImageUrl(p.imageUrl)}>
                          <img src={p.imageUrl} alt="Pearl visual" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <h4 className="font-bold text-xs text-slate-900">{p.title}</h4>
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed font-medium">
                        <div className="font-bold font-['Outfit'] text-[11px] uppercase tracking-wider text-amber-800 mb-1">
                          💡 What to Remember:
                        </div>
                        {takeawayText}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{p.id.slice(-6)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleSaveItem({
                            itemId: p.id,
                            itemType: "pearl",
                            subject: p.subject || "General Medicine",
                            title: p.title,
                            content: takeawayText,
                            mediaUrl: p.imageUrl,
                            mediaType: p.imageUrl ? "IMAGE" : "NONE",
                            tags: ["Pearl", p.subject || "Medicine"],
                          })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1.5 cursor-pointer ${
                            savedBookmarkIds[p.id]
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <Star className={`h-3.5 w-3.5 ${savedBookmarkIds[p.id] ? "fill-amber-500 text-amber-500" : ""}`} />
                          {savedBookmarkIds[p.id] ? "Saved" : "Save to Vault"}
                        </button>

                        <button
                          onClick={() => {
                            onSaveAsPearl?.({
                              title: p.title,
                              takeaway: takeawayText,
                              subject: (p.subject || "medicine").toLowerCase(),
                              topic: "Exam Pearl",
                              isBookmarked: true,
                              tags: ["Pearl", p.subject || "Medicine"],
                            } as any);
                            confetti({ particleCount: 20, spread: 45 });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold font-['Outfit'] transition-all flex items-center gap-1 cursor-pointer"
                          title="Add to Medical Pearls Vault"
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Telegram Sources ({sources.length})
            </h3>
          </div>
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
      {(activeTab === "cross_checks" || (mobileSegment === "browse" && filteredCrossChecks.length > 0)) && (
        <div className={`space-y-4 ${activeTab !== "cross_checks" ? "sm:hidden" : ""}`}>
          <div className="sm:hidden flex items-center justify-between pt-4 pb-1 border-b border-stone-200">
            <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              AI Cross-Checks ({filteredCrossChecks.length})
            </h3>
          </div>
          {filteredCrossChecks.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto" />
              <h3 className="font-bold font-['Outfit'] text-base text-slate-900">
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-['Outfit'] ${
                        isTrap
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}>
                        {isTrap ? "⚠️ DISPUTED TRAP / CONFLICT" : "✓ AI VERIFIED & AGREED"}
                      </span>
                      {q && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-['Outfit'] bg-slate-100 text-slate-700 border border-slate-200">
                          {q.subject}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Telegram: <strong className="text-slate-900">Option {cc.originalAnswer}</strong> ➔ Gemini AI: <strong className="text-purple-700">Option {cc.aiAnswer}</strong>
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
                    <div className="font-bold font-['Outfit'] mb-1 text-[11px] uppercase tracking-wider text-slate-500">
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

      {/* Mobile Bottom Navigation Safe Clearance Spacer */}
      <div className="h-28 sm:hidden pointer-events-none" aria-hidden="true" />

      {/* ========================================================================= */}
      {/* AUTHENTICATION MODAL: QR CODE (Default) + PHONE NUMBER (Fallback) */}
      {/* ========================================================================= */}
      {isConnectModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
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
        </div>,
        document.body,
      )}

      {/* Manage Connected Telegram Account Modal */}
      {isManageModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#229ED9]" />
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Telegram Account Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
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
                  className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#00685f] border border-teal-200 font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isManualSyncing ? "animate-spin" : ""}`} />
                  {isManualSyncing ? "Syncing MTProto..." : "⚡ Auto-Sync Channels Now"}
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
                  <Zap className={`w-4 h-4 ${isReEnriching ? "animate-spin" : ""}`} />
                  {isReEnriching ? "Verifying..." : "⚡ Clinical Cross-Check (Gemini)"}
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
