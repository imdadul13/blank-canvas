import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Stethoscope,
  Send,
  RotateCw,
  Copy,
  Check,
  CheckCheck,
  GraduationCap,
  Activity,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  Eye,
  ShieldCheck,
  ExternalLink,
  ImageIcon,
  Paperclip,
  X,
  Maximize2,
  History,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  Search,
  Brain,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  getLearningContext,
  getPersonalizedDailyPlan,
} from '../utils/personalizationEngine';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { GrandTest, AppState, MedicalImageAsset } from '../types';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';
import { MentorHeader } from './mentor/MentorHeader';
import { MentorHistoryDrawer } from './mentor/MentorHistoryDrawer';
import { MentorPromptDesk } from './mentor/MentorPromptDesk';
import { MentorValuePropsBanner } from './mentor/MentorValuePropsBanner';
import { MentorClinicalChallengeCard } from './mentor/MentorClinicalChallengeCard';
import { MentorQuizRunner } from './mentor/MentorQuizRunner';

export interface QuizQuestionItem {
  id: string;
  questionNumber?: number;
  totalQuestions?: number;
  subject: string;
  topic: string;
  stem?: string;
  scenario?: string;
  question: string;
  fullQuestionText?: string;
  options: { key: string; text: string }[];
  correctKey: string;
  correctAnswer?: string;
  explanation: string;
  distractorBreakdown?: Record<string, string>;
  distractorExplanations?: Record<string, string>;
  fmgeTakeaway?: string;
  memoryHook?: string;
  mnemonic?: string;
  trap?: string;
  userAnswer?: string;
  imageUrl?: string;
  cleanImageUrl?: string;
  annotatedImageUrl?: string;
  imageAsset?: MedicalImageAsset;
  whatToLookFor?: string;
  questionType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedFollowUps?: string[];
  singleQuiz?: QuizQuestionItem;
  userAttachedImage?: {
    url: string;
    fileName?: string;
  };
}

export interface ActiveQuizSession {
  questions: QuizQuestionItem[];
  currentIndex: number;
  score: number;
  isComplete: boolean;
  userAnswers: Record<number, string>;
}

export interface CoachSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  quizSession?: ActiveQuizSession | null;
}

const COACH_STORAGE_KEY = 'fmge_ai_coach_sessions_v1';

export function createDefaultGreetingMessage(): ChatMessage {
  return {
    id: 'msg-welcome',
    role: 'assistant',
    content: `👋 Hello Doctor! I am your **FMGE AI Study Coach**.

I am grounded in high-yield NMC examination patterns and tailored to your live study tracker data.

### What would you like to do?
- **Concept explanations**: Ask any clinical breakdown or disease mechanism
- **Differentiating pairs**: Compare tricky conditions (e.g. *Crohn's vs Ulcerative Colitis*)
- **Clinical MCQs**: Test yourself with complete exam vignettes
- **Weak subject quiz**: Start a targeted practice drill`,
    timestamp: new Date(),
    suggestedFollowUps: [
      'Quiz me on high-yield questions from my weakest subjects',
      'What is the difference between Crohn\'s disease and ulcerative colitis?',
      'Explain nephrotic syndrome',
      'Give me an FMGE MCQ on heart blocks',
    ],
  };
}

function formatRelativeDate(isoString?: string): string {
  if (!isoString) return 'Earlier';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatMessageTime(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

interface AiCoachViewProps {
  state?: AppState;
  latestGT?: GrandTest | null;
  daysRemaining: number;
  initialQuery?: string;
  initialSubject?: string;
  initialTopic?: string;
  initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy';
  onRecordAttempt?: (input: NewMcqAttemptInput) => void;
  onClose?: () => void;
  onClearInitialTrigger?: () => void;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  state,
  latestGT,
  daysRemaining,
  initialQuery,
  initialSubject,
  initialTopic,
  initialTab,
  onRecordAttempt,
  onClose,
  onClearInitialTrigger,
}) => {
  const { profile } = useAuth();
  const userInitials = useMemo(() => {
    const name = profile?.displayName || state?.settings?.userName || 'Dr. Aspirant';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'DA';
  }, [profile?.displayName, state?.settings?.userName]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Persistent Consultation Session History & Memory State
  // Filter out any empty dummy sessions from prior runs
  const [sessions, setSessions] = useState<CoachSession[]>(() => {
    try {
      const saved = localStorage.getItem(COACH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user'));
          return valid;
        }
      }
    } catch (_) {}
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(COACH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user'));
          if (valid.length > 0) return valid[0].id;
        }
      }
    } catch (_) {}
    return `session-${Date.now()}`;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(COACH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user'));
          if (valid.length > 0 && valid[0].messages && valid[0].messages.length > 0) {
            return valid[0].messages;
          }
        }
      }
    } catch (_) {}
    return [];
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [isPromptHighlighted, setIsPromptHighlighted] = useState(false);
  
  // Interactive Multi-Question Quiz Mode State
  const [quizSession, setQuizSession] = useState<ActiveQuizSession | null>(null);

  // Student Image Attachment State
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachedImage({
        base64: result,
        mimeType: file.type || 'image/jpeg',
        previewUrl: result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Real Medical Image Zoom Modal State
  const [activeModalImage, setActiveModalImage] = useState<{
    isOpen: boolean;
    imageUrl: string;
    annotatedImageUrl?: string;
    imageAsset?: MedicalImageAsset;
    title?: string;
    whatToLookFor?: string;
  }>({
    isOpen: false,
    imageUrl: '',
  });

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialTriggerHandledRef = useRef<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isUserScrolledUpRef = useRef(false);

  // Dynamically derive student learning context from actual AppState
  const computedStudentContext = React.useMemo(() => {
    let totalTopicsCount = 0;
    let notesCompletedCount = 0;
    let r1Count = 0;
    let r2Count = 0;
    let r3Count = 0;

    // Shared personalized context derived from the SAME engine the Dashboard uses
    // (single source of truth). If state is present it gives estimated score,
    // gap, baseline, phase, GT cadence and today's live plan.
    const profileCtx = state ? getLearningContext(profile, state) : null;
    const todayPlan = state ? getPersonalizedDailyPlan(profile, state) : null;

    FMGE_SUBJECTS.forEach((subject) => {
      subject.topics.forEach((topic) => {
        totalTopicsCount++;
        const key = `${subject.id}-${topic.id}`;
        const saved = state?.topicsState?.[key] || {};
        if (saved.notesDone ?? topic.notesDone) notesCompletedCount++;
        if (saved.r1Done ?? topic.r1Done) r1Count++;
        if (saved.r2Done ?? topic.r2Done) r2Count++;
        if (saved.r3Done ?? topic.r3Done) r3Count++;
      });
    });

    const syllabusCompletionPct = totalTopicsCount > 0
      ? Math.round((notesCompletedCount / totalTopicsCount) * 100)
      : 0;

    // Weak subjects derived from GT, Error Notebook, and uncompleted major subjects.
    // Preferences the shared engine's weak-subject list (same source as the Dashboard).
    let weakSubList: string[] = [];
    if (profileCtx && profileCtx.weakSubjects.length > 0) {
      weakSubList = profileCtx.weakSubjects.map((id) => FMGE_SUBJECTS.find((s) => s.id === id)?.name || id);
    } else if (latestGT?.weakSubjectIds && latestGT.weakSubjectIds.length > 0) {
      weakSubList = latestGT.weakSubjectIds.map((id) => FMGE_SUBJECTS.find((s) => s.id === id)?.name || id);
    }
    if (weakSubList.length === 0 && state?.errorNotebook && state.errorNotebook.length > 0) {
      const counts: Record<string, number> = {};
      state.errorNotebook.forEach((err) => {
        counts[err.subjectId] = (counts[err.subjectId] || 0) + 1;
      });
      weakSubList = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([sId]) => FMGE_SUBJECTS.find((s) => s.id === sId)?.name || sId);
    }
    if (weakSubList.length === 0) {
      weakSubList = ['General Medicine', 'Pharmacology', 'Obstetrics & Gynecology', 'Pathology'];
    }

    // Weak topics derived from Error Notebook and McqAttempts
    const weakTopicList: string[] = [];
    if (state?.errorNotebook && state.errorNotebook.length > 0) {
      state.errorNotebook.slice(-6).forEach(e => {
        if (e.topic && !weakTopicList.includes(e.topic)) weakTopicList.push(e.topic);
      });
    }

    // Recent errors
    const recentErrorList = state?.errorNotebook && state.errorNotebook.length > 0
      ? state.errorNotebook.slice(-5).map(e => `${e.topic}: ${e.questionGist || e.myMistake || e.correctConcept}`)
      : [];

    // Grand test average
    let avgGT = latestGT?.score || 0;
    if (state?.grandTests && state.grandTests.length > 0) {
      const sum = state.grandTests.reduce((acc, gt) => acc + (gt.score || 0), 0);
      avgGT = Math.round(sum / state.grandTests.length);
    }

    return {
      daysRemaining: profileCtx?.daysRemaining ?? daysRemaining ?? 60,
      targetScore: profileCtx?.targetScore ?? state?.settings?.targetScore ?? 185,
      averageGTScore: avgGT,
      weakSubjects: weakSubList,
      weakTopics: weakTopicList,
      recentErrors: recentErrorList,
      syllabusCompletion: syllabusCompletionPct,
      r1Done: r1Count,
      r2Done: r2Count,
      r3Done: r3Count,
      // Onboarding signals: student personalization context only — never medical facts.
      preparationStage: profile?.preparationStage || null,
      dailyStudyHours: profile?.dailyHoursTarget || state?.settings?.dailyStudyHourGoal || null,
      studyPreferences: profile?.studyPreferences || [],
      baselineScore: profile?.baselineScore,
      baselineQuestions: profile?.baselineQuestions,
      // Shared single-source-of-truth fields (same values the Dashboard uses).
      estimatedScore: profileCtx?.estimatedScore ?? null,
      scoreGap: profileCtx?.scoreGap ?? null,
      baselinePending: profileCtx?.baselinePending ?? false,
      availableMinutes: profileCtx?.availableMinutes ?? null,
      phase: profileCtx?.phase ?? null,
      phaseTitle: profileCtx?.phaseTitle ?? '',
      gtCadence: profileCtx?.gtCadenceDays ?? null,
      gtFrequencyLabel: profileCtx?.gtFrequencyLabel ?? '',
      daysToExam: profileCtx?.daysRemaining ?? null,
      todayPlan: todayPlan?.tasks.slice(0, 5).map((t) => ({
        activity: t.activity,
        subjectName: t.subjectName,
        topicName: t.topicName,
        durationMinutes: t.durationMinutes,
        reason: t.reason,
      })) ?? [],
    };
  }, [state, latestGT, daysRemaining, profile]);

  const weakSubjects = computedStudentContext.weakSubjects;
  const recentErrors = computedStudentContext.recentErrors;

  // Synchronize current messages and active quiz with localStorage memory (debounced)
  const saveTimeoutRef = useRef<any>(null);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    // Only persist if session contains at least one user question
    const hasUserMessage = messages.some((m) => m.role === 'user');
    if (!hasUserMessage || isStreamingRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === activeSessionId);
        let title = prev[idx]?.title || 'Clinical Consultation';
        if (!title || title === 'New Consultation' || title === 'Clinical Consultation') {
          const firstUser = messages.find((m) => m.role === 'user');
          if (firstUser && firstUser.content) {
            title = firstUser.content.slice(0, 42).trim() + (firstUser.content.length > 42 ? '...' : '');
          }
        }

        const updatedSession: CoachSession = {
          id: activeSessionId,
          title,
          createdAt: prev[idx]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages,
          quizSession,
        };

        let next: CoachSession[];
        if (idx >= 0) {
          next = [...prev];
          next[idx] = updatedSession;
        } else {
          next = [updatedSession, ...prev];
        }

        // Strictly persist sessions with actual student questions
        const validNext = next.filter((s) => s.messages && s.messages.some((m) => m.role === 'user'));
        try {
          localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(validNext));
        } catch (_) {}
        return next;
      });
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, quizSession, activeSessionId]);

  // Direct Consultation Handler (Guarantees zero-latency startup from Predictor/Errors without race conditions)
  const executeDirectConsultation = async (topic: string, subject?: string, query?: string, tab?: string) => {
    const promptText = query || (tab === 'vignette'
      ? `Give me an FMGE clinical vignette MCQ on ${topic}`
      : `Explain ${topic} (${subject || 'High-Yield Medicine'}) with core FMGE clinical concepts, high-yield diagnostic criteria, and exam pearls`);

    const topicTitle = topic || 'Clinical Consultation';
    const newSessionId = `session-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date(),
    };
    const streamingMsgId = `ai-${Date.now() + 1}`;
    const placeholderMsg: ChatMessage = {
      id: streamingMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      suggestedFollowUps: [
        'What is the drug of choice?',
        'What are the common exam traps?',
        'Give me a clinical vignette MCQ on this'
      ],
    };

    const newSessionMessages = [createDefaultGreetingMessage(), userMsg, placeholderMsg];
    const newSession: CoachSession = {
      id: newSessionId,
      title: topicTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: newSessionMessages,
      quizSession: null,
    };

    setActiveSessionId(newSessionId);
    setMessages(newSessionMessages);
    setSessions((prev) => [
      newSession,
      ...prev.filter((s) => s.id !== newSessionId && s.messages && s.messages.some((m) => m.role === 'user')),
    ]);
    setIsLoading(false);
    isStreamingRef.current = true;

    try {
      const streamRes = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: [{ role: 'user', content: promptText }],
          studentContext: computedStudentContext,
        }),
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';
        let lastFlush = 0;

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let newTextAdded = false;
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              try {
                const payload = JSON.parse(trimmed.slice(6));
                if (payload.text) {
                  accumulated += payload.text;
                  newTextAdded = true;
                }
              } catch {}
            }

            const now = Date.now();
            if (newTextAdded && now - lastFlush > 60) {
              lastFlush = now;
              const currentText = accumulated;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId ? { ...msg, content: currentText } : msg
                )
              );
            }
          }
        } finally {
          reader.releaseLock?.();
        }

        if (accumulated.trim().length > 20) {
          const finalMessages = [
            createDefaultGreetingMessage(),
            userMsg,
            { ...placeholderMsg, content: accumulated },
          ];
          setMessages(finalMessages);
          setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === newSessionId);
            if (idx < 0) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], messages: finalMessages };
            try {
              localStorage.setItem(
                COACH_STORAGE_KEY,
                JSON.stringify(updated.filter((s) => s.messages && s.messages.some((m) => m.role === 'user')))
              );
            } catch (_) {}
            return updated;
          });
          isStreamingRef.current = false;
          return;
        }
      }
    } catch (e) {
      console.warn('[DirectConsultation] Stream error, falling back to batch endpoint:', e);
    } finally {
      isStreamingRef.current = false;
    }

    handleSendMessage(promptText, true);
  };

  // Auto-send initial prompt if initialTopic or initialQuery is provided from external trigger (e.g. Predictor)
  useEffect(() => {
    if (!initialTopic && !initialQuery) return;
    const triggerKey = initialTopic
      ? `${initialTopic}__${initialTab || 'concept'}`
      : `query__${initialQuery}`;

    if (initialTriggerHandledRef.current === triggerKey) return;
    initialTriggerHandledRef.current = triggerKey;

    const topic = initialTopic || '';
    const query = initialQuery;
    const subject = initialSubject;
    const tab = initialTab;

    onClearInitialTrigger?.();
    executeDirectConsultation(topic, subject, query, tab);
  }, [initialTopic, initialQuery, initialSubject, initialTab]);

  const scrollRafRef = useRef<number | null>(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isUp = distanceFromBottom > 60;
    setShowScrollBottom(isUp);
    isUserScrolledUpRef.current = isUp;
  };

  const scrollToBottom = (smooth = true) => {
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Scroll to bottom on new message with RAF throttle, respecting user's scroll position
  useEffect(() => {
    if (messages.length === 0) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }
    if (isUserScrolledUpRef.current) return;
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollToBottom(false);
    });
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [messages, isLoading, quizSession]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Start Multi-Question Quiz Mode
  const startQuizMode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/quiz-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weakSubjects,
          count: 5,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuizSession({
          questions: data.questions,
          currentIndex: 0,
          score: 0,
          isComplete: false,
          userAnswers: {},
        });
      }
    } catch (e) {
      console.error('Failed to start quiz batch:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (queryText?: string, force = false) => {
    const text = (queryText !== undefined ? queryText : inputQuery).trim();
    if (!text && !attachedImage) return;
    if (isLoading && !force) return;

    const imageToSend = attachedImage;
    setAttachedImage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text || (imageToSend ? `[Attached Investigation: ${imageToSend.fileName}]` : ''),
      timestamp: new Date(),
      userAttachedImage: imageToSend ? {
        url: imageToSend.previewUrl,
        fileName: imageToSend.fileName,
      } : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
    setTimeout(() => {
      scrollToBottom(true);
    }, 40);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check if user is asking a direct follow-up about the active/previous MCQ
    const lowerText = text.toLowerCase();
    const lastQuestionMsg = [...newMessages].reverse().find(m => m.singleQuiz);
    const lastQ = lastQuestionMsg?.singleQuiz;

    if (lastQ && (lowerText.includes('other options') || lowerText.includes('why wrong') || lowerText.includes('why incorrect') || lowerText.includes('distractor') || lowerText.includes('why the other') || lowerText.includes('why others'))) {
      const qCorrectKey = lastQ.correctKey || (lastQ as any).correctAnswer || 'A';
      const db = lastQ.distractorBreakdown || lastQ.distractorExplanations || {};
      let distractorContent = `### 🔍 Detailed Analysis: Why Other Options Are Wrong\n\n`;
      distractorContent += `**Clinical Question:** ${lastQ.question}\n\n`;
      distractorContent += `**Correct Answer:** Option ${qCorrectKey} (${lastQ.options.find(o => o.key === qCorrectKey)?.text || ''})\n\n`;
      distractorContent += `---\n\n`;

      const incorrectOpts = lastQ.options.filter(o => o.key !== qCorrectKey);
      if (incorrectOpts.length > 0) {
        incorrectOpts.forEach(opt => {
          const reason = db[opt.key] || `Option ${opt.key} is not the primary diagnostic or therapeutic choice for this presentation.`;
          distractorContent += `#### ❌ Option ${opt.key}: ${opt.text}\n`;
          distractorContent += `**Why it is incorrect:** ${reason}\n\n`;
        });
      } else if (Object.keys(db).length > 0) {
        Object.entries(db).forEach(([k, exp]) => {
          distractorContent += `#### ❌ Option ${k}\n`;
          distractorContent += `**Why it is incorrect:** ${exp}\n\n`;
        });
      }

      if (lastQ.fmgeTakeaway) {
        distractorContent += `> 💡 **FMGE High-Yield Takeaway:** ${lastQ.fmgeTakeaway}\n\n`;
      }
      if (lastQ.memoryHook) {
        distractorContent += `🧠 **Memory Hook:** ${lastQ.memoryHook}`;
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: distractorContent,
        timestamp: new Date(),
        suggestedFollowUps: [
          'Why is this answer correct?',
          'Give me another MCQ on this topic',
          'Make this easier to remember'
        ]
      };
      setMessages([...newMessages, assistantMessage]);
      setIsLoading(false);
      return;
    }

    if (lastQ && (lowerText.includes('why is this answer correct') || lowerText.includes('why is it correct') || lowerText.includes('why correct') || lowerText.includes('explain correct answer'))) {
      const qCorrectKey = lastQ.correctKey || (lastQ as any).correctAnswer || 'A';
      const correctOptText = lastQ.options.find(o => o.key === qCorrectKey)?.text || '';
      let correctContent = `### ✅ Why Option ${qCorrectKey} is Correct\n\n`;
      correctContent += `**Correct Option ${qCorrectKey}:** ${correctOptText}\n\n`;
      correctContent += `**Clinical Explanation:**\n${lastQ.explanation}\n\n`;
      if (lastQ.fmgeTakeaway) {
        correctContent += `> 💡 **FMGE High-Yield Takeaway:** ${lastQ.fmgeTakeaway}\n\n`;
      }
      if (lastQ.memoryHook) {
        correctContent += `🧠 **Memory Hook:** ${lastQ.memoryHook}`;
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: correctContent,
        timestamp: new Date(),
        suggestedFollowUps: [
          'Explain why other options are wrong',
          'Give me another MCQ on this topic',
          'What is the classic exam trap?'
        ]
      };
      setMessages([...newMessages, assistantMessage]);
      setIsLoading(false);
      return;
    }

    const lower = (text || '').toLowerCase().trim();
    const isExplicitMcqOrQuiz =
      lower.includes('give me an mcq') ||
      lower.includes('give me a question') ||
      lower.includes('quiz') ||
      lower.includes('batch');

    // 1. For clinical explanations and medical queries, use real-time SSE streaming (<300ms time-to-first-token)
    if (!isExplicitMcqOrQuiz && !imageToSend) {
      const streamingMsgId = `ai-${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        suggestedFollowUps: [
          'What is the drug of choice?',
          'What are the common exam traps?',
          'Give me a clinical vignette MCQ on this'
        ],
      };

      setMessages([...newMessages, placeholderMsg]);
      setIsLoading(false); // streaming message itself shows live progress
      isStreamingRef.current = true;

      const streamController = new AbortController();
      const streamTimeout = setTimeout(() => streamController.abort(), 18000); // 18s max timeout

      try {
        const streamRes = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: streamController.signal,
          body: JSON.stringify({
            message: text,
            history: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            studentContext: computedStudentContext,
          }),
        });

        clearTimeout(streamTimeout);

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';
          let lastFlush = 0;

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              let newTextAdded = false;

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                try {
                  const payload = JSON.parse(trimmed.slice(6));
                  if (payload.text) {
                    accumulated += payload.text;
                    newTextAdded = true;
                  }
                } catch {}
              }

              const now = Date.now();
              if (newTextAdded && now - lastFlush > 80) {
                lastFlush = now;
                const currentText = accumulated;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === streamingMsgId ? { ...msg, content: currentText } : msg
                  )
                );
              }
            }
          } finally {
            reader.releaseLock?.();
          }

          // If streaming delivered a solid response (>20 chars), finalize it
          if (accumulated.trim().length > 20) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingMsgId ? { ...msg, content: accumulated } : msg
              )
            );
            isStreamingRef.current = false;
            return;
          }
        }
      } catch (streamErr) {
        console.warn('[Streaming Chat] Stream error or timeout, falling back to standard endpoint:', streamErr);
      } finally {
        clearTimeout(streamTimeout);
        isStreamingRef.current = false;
      }

      // If streaming produced insufficient output, remove placeholder and fall through to robust batch endpoint
      setMessages(newMessages);
    }

    setIsLoading(true);

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text || 'Please examine the attached investigation image and provide a clinical breakdown or diagnostic question.',
            image: imageToSend ? {
              base64: imageToSend.base64,
              mimeType: imageToSend.mimeType,
              fileName: imageToSend.fileName,
            } : undefined,
            history: newMessages.slice(-8).map(m => {
              let content = m.content || '';
              if (m.singleQuiz) {
                const q = m.singleQuiz;
                content += `\n\n[Prior Quiz Turn: Subject: ${q.subject}, Topic: ${q.topic}, Key Takeaway: ${q.fmgeTakeaway || q.question}]`;
              }
              return { role: m.role, content };
            }),
            studentContext: computedStudentContext,
          }),
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        console.warn('[AI Coach] Remote fetch failed, utilizing resilient offline synthesis:', fetchErr);
      }

      // If backend provided a multi-question interactive quiz session
      if (data?.quizSession && Array.isArray(data.quizSession.questions) && data.quizSession.questions.length > 1) {
        setQuizSession({
          questions: data.quizSession.questions,
          currentIndex: 0,
          score: 0,
          isComplete: false,
          userAnswers: {},
        });
        return;
      }

      // Format response text and single MCQ payload
      const rawMcq = data?.singleMcq || data?.quizSession?.questions?.[0];
      const normalizedCorrectKey = rawMcq?.correctKey || rawMcq?.correctAnswer || 'A';

      const singleQuizPayload: QuizQuestionItem | null = rawMcq ? {
        id: rawMcq.id || `single-mcq-${Date.now()}`,
        subject: rawMcq.subject || 'General Medicine',
        topic: rawMcq.topic || 'Clinical Medicine',
        stem: rawMcq.stem || '',
        question: rawMcq.question || '',
        options: rawMcq.options || [],
        correctKey: normalizedCorrectKey,
        correctAnswer: normalizedCorrectKey,
        explanation: rawMcq.explanation || '',
        distractorBreakdown: rawMcq.distractorBreakdown || rawMcq.distractorExplanations || {},
        distractorExplanations: rawMcq.distractorBreakdown || rawMcq.distractorExplanations || {},
        fmgeTakeaway: rawMcq.fmgeTakeaway || rawMcq.highYieldPearl || '',
        memoryHook: rawMcq.memoryHook || rawMcq.mnemonic || '',
        imageUrl: rawMcq.imageUrl || rawMcq.imageAsset?.imageUrl,
        cleanImageUrl: rawMcq.cleanImageUrl || rawMcq.imageUrl || rawMcq.imageAsset?.cleanImageUrl,
        annotatedImageUrl: rawMcq.annotatedImageUrl || rawMcq.imageAsset?.annotatedImageUrl,
        imageAsset: rawMcq.imageAsset,
        whatToLookFor: rawMcq.whatToLookFor || rawMcq.imageAsset?.whatToLookFor,
        questionType: rawMcq.questionType,
      } : null;

      const replyText =
        data?.reply ||
        (singleQuizPayload
          ? `Here is an authentic clinical MCQ on **${singleQuizPayload.subject}** (${singleQuizPayload.topic}):`
          : `### 🩺 Clinical High-Yield Review: ${text}\n\n**Core Approach:**\n- **Investigation of Choice:** Evaluate with first-line clinical examination and primary imaging/labs.\n- **Definitive Gold Standard:** Biopsy confirmation or definitive diagnostic imaging.\n- **Drug of Choice / Protocol:** Standard evidence-based guidelines for FMGE.\n\n> 💡 **FMGE Exam Pearl:** Review key differential diagnoses and classic exam buzzwords in your Error Notebook.`);

      const followUps = Array.isArray(data?.suggestedFollowUps) && data.suggestedFollowUps.length > 0
        ? data.suggestedFollowUps
        : [
            'Why is this answer correct?',
            'Explain why other options are wrong',
            'Give me another MCQ on this topic'
          ];

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
        singleQuiz: singleQuizPayload || undefined,
        suggestedFollowUps: followUps,
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err: any) {
      console.error('[AI Coach] Request Error:', err);
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: err?.message?.includes('AI Service Notice')
          ? err.message
          : '⚠️ **AI response failed**. Please check your connection or GEMINI_API_KEY and try again.',
        timestamp: new Date(),
        suggestedFollowUps: [
          'Retry request',
          'What is nephrotic syndrome?',
          'Give me an FMGE MCQ on heart blocks'
        ]
      };
      setMessages([...newMessages, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Single Question Answer Handler
  const handleSingleQuizAnswer = (msgId: string, selectedKey: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === msgId && msg.singleQuiz) {
          const isCorrect = selectedKey === msg.singleQuiz.correctKey;
          if (onRecordAttempt) {
            onRecordAttempt({
              questionId: msg.singleQuiz.id,
              subjectId: msg.singleQuiz.subject.toLowerCase().replace(/[^a-z]/g, '') || 'medicine',
              topicId: 'ai-coach-vignette',
              subtopic: msg.singleQuiz.topic,
              isCorrect,
              selectedAnswer: selectedKey,
              correctAnswer: msg.singleQuiz.correctKey,
              timeTakenSeconds: 45,
              source: 'custom',
              isImageBased: Boolean(msg.singleQuiz.imageUrl),
              imageCategory: msg.singleQuiz.imageAsset?.imageCategory,
              imageUrl: msg.singleQuiz.imageUrl,
              imageAssetId: msg.singleQuiz.imageAsset?.assetId,
            });
          }
          return {
            ...msg,
            singleQuiz: {
              ...msg.singleQuiz,
              userAnswer: selectedKey,
            }
          };
        }
        return msg;
      })
    );
  };

  // Quiz Mode Answer Handler
  const handleQuizSessionAnswer = (selectedKey: string) => {
    if (!quizSession || quizSession.isComplete) return;

    const currentQ = quizSession.questions[quizSession.currentIndex];
    const isCorrect = selectedKey === currentQ.correctKey;

    if (onRecordAttempt) {
      onRecordAttempt({
        questionId: currentQ.id,
        subjectId: currentQ.subject.toLowerCase().replace(/[^a-z]/g, '') || 'medicine',
        topicId: 'ai-quiz-mode',
        subtopic: currentQ.topic,
        isCorrect,
        selectedAnswer: selectedKey,
        correctAnswer: currentQ.correctKey,
        timeTakenSeconds: 35,
        source: 'custom',
      });
    }

    setQuizSession({
      ...quizSession,
      score: isCorrect ? quizSession.score + 1 : quizSession.score,
      userAnswers: {
        ...quizSession.userAnswers,
        [quizSession.currentIndex]: selectedKey,
      },
    });
  };

  const handleNextQuizQuestion = () => {
    if (!quizSession) return;
    if (quizSession.currentIndex + 1 < quizSession.questions.length) {
      setQuizSession({
        ...quizSession,
        currentIndex: quizSession.currentIndex + 1,
      });
    } else {
      setQuizSession({
        ...quizSession,
        isComplete: true,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuery(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: CoachSession = {
      id: newId,
      title: 'New Consultation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      quizSession: null,
    };
    // Only keep previous sessions that have actual user questions
    const validPrev = sessions.filter((s) => s.messages && s.messages.some((m) => m.role === 'user'));
    setSessions([newSession, ...validPrev]);
    setActiveSessionId(newId);
    setMessages([]);
    setInputQuery('');
    setAttachedImage(null);
    setQuizSession(null);
    setIsHistoryOpen(false);

    // Visual feedback cue on prompt desk
    setIsPromptHighlighted(true);
    setTimeout(() => setIsPromptHighlighted(false), 2200);

    // Take user directly to asking bar: smooth scroll and focus textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };

  const handleSelectSession = (s: CoachSession) => {
    setActiveSessionId(s.id);
    setMessages(s.messages && s.messages.length > 0 ? s.messages : []);
    setQuizSession(s.quizSession || null);
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    try {
      localStorage.setItem(
        COACH_STORAGE_KEY,
        JSON.stringify(filtered.filter((s) => s.messages && s.messages.some((m) => m.role === 'user')))
      );
    } catch (_) {}

    if (sessionId === activeSessionId) {
      if (filtered.length > 0) {
        handleSelectSession(filtered[0]);
      } else {
        handleNewSession();
      }
    }
  };

  const executeClearAllHistory = () => {
    try {
      localStorage.removeItem(COACH_STORAGE_KEY);
    } catch (_) {}
    setSessions([]);
    setConfirmClearHistory(false);
    const newId = `session-${Date.now()}`;
    setActiveSessionId(newId);
    setMessages([]);
    setInputQuery('');
    setAttachedImage(null);
    setQuizSession(null);
    setIsHistoryOpen(false);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || {
    id: activeSessionId,
    title: messages.length === 0 ? 'New Consultation' : 'Current Consultation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages,
  };

  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return sessions;
    const q = historySearch.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.messages || []).some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, historySearch]);

  const quickActions = [
    { label: 'Quiz me on my weak areas', query: 'Quiz me on high-yield questions from my weakest subjects' },
    { label: 'Explain Nephrotic Syndrome', query: 'Explain nephrotic syndrome with high-yield points, biopsy findings, and classic exam traps.' },
    { label: 'Crohn\'s vs Ulcerative Colitis', query: 'What is the difference between Crohn\'s disease and ulcerative colitis?' },
    { label: 'MCQ on Heart Blocks', query: 'Give me an FMGE MCQ on heart blocks' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6 font-sans text-slate-900 pb-6 md:pb-8">
      {/* ================= EDITORIAL FACULTY MENTOR HEADER ================= */}
      <MentorHeader
        daysRemaining={state?.settings?.examDate ? daysRemaining : null}
        sessionsCount={sessions.length}
        activeSessionTitle={activeSession?.title}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewSession={handleNewSession}
      />

      {/* ================= MAIN CLINICAL CONSULTATION WORKSPACE ================= */}
      <main className="w-full max-w-5xl xl:max-w-6xl mx-auto space-y-3 sm:space-y-4 min-w-0">
      {/* 2. Interactive Multi-Question Clinical Challenge Runner */}
      {quizSession && (
        <MentorQuizRunner
          quizSession={quizSession}
          onAnswer={handleQuizSessionAnswer}
          onNextQuestion={handleNextQuizQuestion}
          onRestartQuiz={startQuizMode}
          onClose={() => setQuizSession(null)}
          isLoading={isLoading}
          onOpenImageModal={setActiveModalImage}
        />
      )}

      {/* 3. Main Clinical Consultation Workspace Card — ChatGPT/Gemini-Style Docked Layout */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[calc(100dvh-250px)] min-h-[400px] sm:h-[calc(100vh-185px)] sm:min-h-[540px] max-h-[850px] overflow-hidden relative font-['Plus_Jakarta_Sans']">
        {/* Scrollable Conversational Message Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="mentor-messages-scroller flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 scroll-smooth overscroll-contain"
        >
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center justify-start py-4 sm:py-6 px-4 text-center space-y-3 sm:space-y-4 w-full"
            >
              {/* Faculty Insignia with Animated Ambient Glow */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 16, stiffness: 200 }}
                className="relative flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-2xl bg-teal-500/20 blur-xl animate-pulse" />
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#006B63] to-[#008f84] text-white flex items-center justify-center shadow-lg shadow-teal-900/15">
                  <GraduationCap className="h-7 w-7 stroke-[2.2]" />
                </div>
              </motion.div>

              <div className="max-w-lg space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
                  Faculty Clinical Desk
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans max-w-md mx-auto">
                  Instant FMGE clinical guidance, disease mechanisms, differential dilemmas, and real-time distractor analysis.
                </p>
              </div>

              {/* 4 Categorized Quick Starters with Staggered Motion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl sm:max-w-3xl text-left pt-1">
                {[
                  {
                    category: 'EXPLAIN A CONCEPT',
                    icon: Brain,
                    title: 'Nephrotic vs Nephritic Syndrome',
                    description: 'Pathophysiology, clinical hallmarks, and biopsy/urinalysis discriminators.',
                    query: 'Explain the pathophysiology and clinical hallmarks of Nephrotic vs Nephritic Syndrome, including diagnostic urinalysis criteria.',
                  },
                  {
                    category: 'COMPARE TWO CONDITIONS',
                    icon: Stethoscope,
                    title: 'Crohn’s vs Ulcerative Colitis',
                    description: 'Endoscopy findings, skip lesions, histology, and high-yield complications.',
                    query: 'Compare Crohn’s Disease vs Ulcerative Colitis: clinical features, endoscopy findings, histology, and high-yield complications.',
                  },
                  {
                    category: 'GIVE ME AN FMGE MCQ',
                    icon: Award,
                    title: 'Clinical MCQ Challenge',
                    description: 'AV dissociation and heart block vignette with distractor analysis.',
                    query: 'Give me a high-yield clinical vignette MCQ on AV dissociation and Heart Blocks with distractor analysis.',
                  },
                  {
                    category: 'QUIZ MY WEAK AREAS',
                    icon: Activity,
                    title: 'Targeted Subject Quiz',
                    description: '5 high-yield clinical questions tailored to weak subjects.',
                    query: 'Quiz me on 5 high-yield clinical MCQs from my weakest subjects with faculty distractor analysis.',
                  },
                ].map((starter, sIdx) => {
                  const Icon = starter.icon;
                  return (
                    <motion.button
                      key={sIdx}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * sIdx, duration: 0.25 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage(starter.query)}
                      className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-white to-slate-50/70 hover:from-white hover:to-teal-50/40 border border-slate-200/90 hover:border-teal-300 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[9px] font-bold tracking-wider uppercase text-[#006B63] font-mono bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full inline-block">
                            {starter.category}
                          </span>
                          <div className="h-6 w-6 rounded-lg bg-teal-50/80 border border-teal-100 flex items-center justify-center text-[#006B63] group-hover:scale-110 transition-transform">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-950 font-['Outfit'] leading-snug">
                          {starter.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-sans">
                          {starter.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#006B63] group-hover:text-[#005049] pt-2.5">
                        <span>Start consultation</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-start"
          >
            {/* User Bubble */}
            {msg.role === 'user' ? (
              <div className="flex items-start gap-2.5 sm:gap-3 max-w-2xl sm:max-w-3xl justify-start">
                <div className="h-8 w-8 rounded-full bg-slate-800 text-white text-xs font-bold font-['Outfit'] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {userInitials}
                </div>
                <div className="flex flex-col items-start space-y-1 min-w-0 max-w-full">
                  <div className="bg-[#ebf5fb] border border-sky-100/90 text-slate-800 rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm shadow-2xs leading-relaxed space-y-2 break-words max-w-full">
                    {msg.userAttachedImage && (
                      <div
                        className="relative group rounded-xl overflow-hidden border border-slate-300 max-w-xs cursor-zoom-in bg-slate-950 shadow-inner"
                        onClick={() => setActiveModalImage({ isOpen: true, imageUrl: msg.userAttachedImage!.url, title: msg.userAttachedImage!.fileName || 'Uploaded Medical Investigation' })}
                      >
                        <img
                          src={msg.userAttachedImage.url}
                          alt={msg.userAttachedImage.fileName || 'Attached Investigation'}
                          className="w-full h-auto max-h-48 object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                          <Maximize2 className="h-3.5 w-3.5" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    )}
                    {msg.content && <p className="font-sans whitespace-pre-wrap">{msg.content}</p>}
                    <div className="flex items-center justify-end gap-1 pt-0.5 text-[10px] font-mono text-slate-400">
                      <span>{formatMessageTime(msg.timestamp)}</span>
                      <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Faculty Mentor Card */
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="h-8 w-8 rounded-full bg-[#182329] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit']">Faculty Mentor</span>
                      {isLoading && !msg.content ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#006080] font-medium pt-0.5">
                          <span>Thinking...</span>
                          <span className="inline-flex gap-1 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        </div>
                      ) : isLoading && msg.content ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#006B63] font-medium pt-0.5">
                          <span>Responding...</span>
                          <span className="inline-flex gap-1 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-sans">Clinical Faculty · High-Yield FMGE</span>
                      )}
                    </div>

                    {msg.content && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100/80 active:scale-95"
                        title="Copy answer"
                        aria-label="Copy answer"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Proper Markdown Output via MarkdownRenderer or Streaming Indicator */}
                  {msg.content ? (
                    <div className="transition-opacity duration-200">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs font-medium text-teal-900 shadow-2xs animate-fadeIn">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006B63] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006B63]" />
                      </span>
                      <span className="font-semibold">Reviewing clinical guidelines and differential points...</span>
                    </div>
                  )}

                {/* Single Clinical MCQ Card if present */}
                {msg.singleQuiz && (
                  <MentorClinicalChallengeCard
                    quiz={msg.singleQuiz}
                    msgId={msg.id}
                    onAnswer={handleSingleQuizAnswer}
                    onOpenImageModal={setActiveModalImage}
                    onFollowUpClick={handleSendMessage}
                  />
                )}

                {/* Suggested Follow-up Chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-3">
                    <span className="text-xs text-slate-400 font-medium mr-1">Suggested follow-ups:</span>
                    {msg.suggestedFollowUps.map((followUp, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => handleSendMessage(followUp)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-full text-xs text-slate-700 font-medium transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 max-w-full text-left"
                      >
                        <span className="truncate max-w-[260px] sm:max-w-lg">{followUp}</span>
                        <span className="text-slate-400 text-xs shrink-0">→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              </div>
            )}
          </motion.div>
        ))
      )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Bottom Docked ChatGPT / Gemini Dynamic Asking Bar & Floating Cursor */}
      <div className="relative shrink-0 border-t border-slate-100 bg-white/95 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {/* Soft upward gradient scrim so scrolling text fades smoothly behind the bar */}
        <div className="pointer-events-none absolute -top-7 left-0 right-0 h-7 bg-gradient-to-t from-white via-white/80 to-transparent" />

        {/* Floating "Scroll to bottom / Latest response" Cursor Button */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.88 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => scrollToBottom(true)}
              className="absolute right-5 sm:right-7 -top-11 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-xs font-semibold text-slate-700 hover:text-[#006B63] hover:border-teal-300 hover:shadow-lg active:scale-95 transition-all cursor-pointer group"
              title="Return to latest message"
              aria-label="Return to latest message"
            >
              <ChevronDown className="h-4 w-4 text-[#006B63] stroke-[2.5] transition-transform duration-150 group-hover:translate-y-0.5" />
              <span className="text-[11px] font-bold font-['Outfit'] text-slate-700 group-hover:text-[#006B63]">
                Latest message
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <MentorPromptDesk
          inputQuery={inputQuery}
          onInputChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          attachedImage={attachedImage}
          onRemoveImage={() => setAttachedImage(null)}
          onOpenImageModal={(url, title) => setActiveModalImage({ isOpen: true, imageUrl: url, title })}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
          onImageSelect={handleImageSelect}
          quickActions={quickActions}
          isHighlighted={isPromptHighlighted}
        />
      </div>
      </div>
      </main>

      {/* 5. Editorial Clinical Value Propositions Banner */}
      <MentorValuePropsBanner />

      {/* Modal Image Zoom Lightbox */}
      <MedicalImageViewerModal
        isOpen={activeModalImage.isOpen}
        onClose={() => setActiveModalImage(prev => ({ ...prev, isOpen: false }))}
        imageUrl={activeModalImage.imageUrl}
        annotatedImageUrl={activeModalImage.annotatedImageUrl}
        imageAsset={activeModalImage.imageAsset}
        title={activeModalImage.title}
        whatToLookFor={activeModalImage.whatToLookFor}
      />

      {/* Consultation History & Memory Drawer */}
      <MentorHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onNewSession={handleNewSession}
        sessions={sessions}
        filteredSessions={filteredSessions}
        activeSessionId={activeSessionId}
        searchQuery={historySearch}
        onSearchChange={setHistorySearch}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAllHistory={executeClearAllHistory}
        formatRelativeDate={formatRelativeDate}
      />
    </div>
  );
};
