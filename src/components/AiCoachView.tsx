import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  AlertCircle,
  BookmarkCheck,
  BookmarkPlus,
  ShieldAlert,
  Pill,
  Download,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SPRING_SMOOTH, SPRING_SNAPPY } from '@/utils/motionTokens';
import { Button } from './ui/Button';
import { IconTile } from './ui/surface';
import { MENTOR_HUES, RECALL_HUE, type MentorHueKey } from './mentor/mentorPalette';

/** 10% wash + 18% hairline + full-strength text, matching Dashboard's badge triple. */
const chipStyle = (key: MentorHueKey) => {
  const h = MENTOR_HUES[key];
  return {
    color: `color-mix(in srgb, ${h.bar} 84%, black)`,
    background: h.tint,
    borderColor: `color-mix(in srgb, ${h.bar} 20%, transparent)`,
  } as React.CSSProperties;
};
import { speechEngine } from '../utils/speechEngine';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import {
  getLearningContext,
  getPersonalizedDailyPlan,
} from '../utils/personalizationEngine';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { GrandTest, AppState, MedicalImageAsset, MedicalPearl, ErrorNotebookItem } from '../types';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { buildMentorContext, resolveMedicalTopic, detectMentorMode } from '../utils/mentorContextEngine';
import type { LucideIcon } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';
import { MentorHeader } from './mentor/MentorHeader';
import { MentorHistoryDrawer } from './mentor/MentorHistoryDrawer';
import { MentorPromptDesk } from './mentor/MentorPromptDesk';
import { MentorClinicalChallengeCard } from './mentor/MentorClinicalChallengeCard';
import { MentorQuizRunner } from './mentor/MentorQuizRunner';
import { AiKeyConfigModal } from './mentor/AiKeyConfigModal';

interface Starter {
  category: string;
  /** Bound to the mode of asking, so a card keeps its colour when reordered. */
  hue: MentorHueKey;
  icon: LucideIcon;
  title: string;
  description: string;
  query: string;
}

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
  isError?: boolean;
  retryQuery?: string;
}

export interface ActiveQuizSession {
  title?: string;
  subject?: string;
  topic?: string;
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
  isPinned?: boolean;
  subject?: string;
}

const COACH_STORAGE_KEY = 'fmge_ai_coach_sessions_v1';

export function cleanTextForClipboard(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;
  // Strip markdown headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Strip bold/italic formatting
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');
  // Strip blockquotes
  text = text.replace(/^>\s?/gm, '');
  // Strip code blocks and inline code
  text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-z]*\n?/gi, '').replace(/```/g, ''));
  text = text.replace(/`([^`]+)`/g, '$1');
  // Strip markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Strip leftover XML/HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Normalize extra consecutive newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

export function createDefaultGreetingMessage(): ChatMessage {
  return {
    id: 'msg-welcome',
    role: 'assistant',
    content: `Hello Doctor! I am your **FMGE AI Study Coach**.

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

/**
 * Parses raw markdown responses that contain an exam MCQ into an interactive
 * QuizQuestionItem so answers are NEVER revealed immediately to the user.
 */
export function parseMcqFromMarkdown(
  text: string,
  fallbackSubject = 'General Medicine',
  fallbackTopic = 'Clinical Practice'
): { cleanedText: string; quiz: QuizQuestionItem } | null {
  if (!text || text.length < 30) return null;

  // Check if text has distinct options A, B, C, D
  const hasA = /(?:^|\n)\s*(?:[○●\(\[]?\s*A[.\):\]]|\(A\))\s+([^\n]+)/i.test(text);
  const hasB = /(?:^|\n)\s*(?:[○●\(\[]?\s*B[.\):\]]|\(B\))\s+([^\n]+)/i.test(text);
  const hasC = /(?:^|\n)\s*(?:[○●\(\[]?\s*C[.\):\]]|\(C\))\s+([^\n]+)/i.test(text);
  const hasD = /(?:^|\n)\s*(?:[○●\(\[]?\s*D[.\):\]]|\(D\))\s+([^\n]+)/i.test(text);

  if (!hasA || !hasB || !hasC || !hasD) return null;

  // Extract Option text
  const optRegex = /(?:^|\n)\s*(?:[○●\(\[]?\s*([A-D])[.\):\]]|\(([A-D])\))\s+([^\n]+)/gi;
  const options: { key: string; text: string }[] = [];
  let match;
  while ((match = optRegex.exec(text)) !== null) {
    const key = (match[1] || match[2]).toUpperCase();
    if (!options.some((o) => o.key === key)) {
      options.push({ key, text: match[3].trim() });
    }
  }

  if (options.length < 4) return null;

  // Find correct key
  const ansMatch = text.match(/(?:Correct\s+Answer|Ans(?:wer)?|Key|Correct\s+Option)\s*[:\-]?\s*(?:Option\s*)?([A-D])/i);
  const correctKey = ansMatch ? ansMatch[1].toUpperCase() : 'A';

  // Extract stem: everything preceding the first option
  const firstOptMatch = text.search(/(?:^|\n)\s*(?:[○●\(\[]?\s*[A-Da-d][.\):\]]|\([A-Da-d]\))/);
  let stem = firstOptMatch > 0 ? text.substring(0, firstOptMatch).trim() : '';

  // Extract explanation
  let explanation = '';
  const expMatch = text.match(/(?:Explanation|Rationale|Clinical\s+Reasoning)\s*[:\-]?\s*([\s\S]+?)(?=\n\n(?:###|Takeaway|Pearl|Mnemonic|Trap)|$)/i);
  if (expMatch) {
    explanation = expMatch[1].trim();
  } else {
    explanation = 'Review the patient presentation, diagnostic discriminators, and treatment guidelines.';
  }

  // Extract takeaway / pearl
  let fmgeTakeaway = '';
  const pearlMatch = text.match(/(?:FMGE\s+Takeaway|Clinical\s+Pearl|High-Yield\s+Takeaway)\s*[:\-]?\s*([^\n]+)/i);
  if (pearlMatch) {
    fmgeTakeaway = pearlMatch[1].trim();
  }

  // Extract exam trap
  let trap = '';
  const trapMatch = text.match(/(?:Exam\s+Trap|Common\s+Trap|NBE\s+Trap)\s*[:\-]?\s*([^\n]+)/i);
  if (trapMatch) {
    trap = trapMatch[1].trim();
  }

  // Clean the text displayed above the interactive MCQ card so the answer is hidden
  const cleanedText = stem || 'Here is your targeted clinical examination challenge:';

  return {
    cleanedText,
    quiz: {
      id: `extracted-${Date.now()}`,
      subject: fallbackSubject,
      topic: fallbackTopic,
      stem: '',
      question: stem.split('\n').filter(Boolean).pop() || 'What is the most likely diagnosis or next best step?',
      options,
      correctKey,
      correctAnswer: correctKey,
      explanation,
      fmgeTakeaway,
      trap,
    },
  };
}

export function generateMentorSessionTitle(messages: ChatMessage[], quizSession?: ActiveQuizSession | null): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser || !firstUser.content) return 'Clinical Consultation';
  const query = firstUser.content;
  const lower = query.toLowerCase();

  // 1. Comparison check
  if (lower.includes(' vs ') || lower.includes(' versus ') || lower.includes('compare ')) {
    if (lower.includes('crohn') && lower.includes('uc')) return "Crohn's vs Ulcerative Colitis";
    if (lower.includes('nephrotic') && lower.includes('nephritic')) return 'Nephrotic vs Nephritic';
    if (lower.includes('dka') && lower.includes('hhs')) return 'DKA vs HHS';
    if (lower.includes('asthma') && lower.includes('copd')) return 'Asthma vs COPD';
  }

  // 2. Count check
  const countMatch = query.match(/\b(\d+)\s*(?:harder\s+)?(?:mcqs?|questions?|vignettes?)\b/i) ||
    query.match(/\b(?:gimme|give me)\s+(\d+)\b/i);
  const count = countMatch ? countMatch[1] : (quizSession?.questions?.length || null);

  const resolved = resolveMedicalTopic(query);
  const baseTopic = resolved?.canonicalTopic || (quizSession?.topic) || null;

  if (baseTopic) {
    const cleanTopic = baseTopic.split('·').pop()?.trim() || baseTopic;
    if (count) return `${cleanTopic} — ${count} MCQs`;
    if (lower.includes('rapid review') || lower.includes('explain') || lower.includes('review')) {
      return `${cleanTopic} — Rapid Review`;
    }
    if (lower.includes('mcq') || lower.includes('question') || lower.includes('practice')) {
      return `${cleanTopic} — Clinical Practice`;
    }
    return cleanTopic;
  }

  const clean = query.replace(/^(gimme|give me|explain|what is|tell me about|quiz me on)\s+/i, '').trim();
  return clean.slice(0, 36) + (clean.length > 36 ? '...' : '');
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
  onNavigateToStudy?: (subjectId: string, topicId?: string) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string, subtopic?: string) => void;
  onClose?: () => void;
  onClearInitialTrigger?: () => void;
  onAddCustomPearl?: (pearl: MedicalPearl) => void;
  onAddErrorItem?: (item: ErrorNotebookItem) => void;
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
  onNavigateToStudy,
  onLaunchPracticeSession,
  onClose,
  onClearInitialTrigger,
  onAddCustomPearl,
  onAddErrorItem,
}) => {
  const { profile, user, isGuest } = useAuth();
  const [historyReady, setHistoryReady] = useState(false);
  const historyUidRef = useRef<string | null>(null);
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
  const [savedPearlIds, setSavedPearlIds] = useState<Set<string>>(new Set());
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [isGoldenHourActive, setIsGoldenHourActive] = useState(false);

  const handleSaveToPearls = (msgId: string, content: string) => {
    if (!onAddCustomPearl || !content) return;
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines.find((l) => !l.startsWith('![') && !l.startsWith('<')) || 'Clinical Faculty Pearl';
    const cleanTitle = firstLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').slice(0, 75).trim();
    const pearlId = `pearl-mentor-${Date.now()}`;
    const resolvedSubject = resolveMedicalTopic(content) || resolveMedicalTopic(cleanTitle);
    const subjectId = resolvedSubject?.subjectId || initialSubject || 'medicine';
    const subjectName = FMGE_SUBJECTS.find((s) => s.id === subjectId)?.name || 'General Medicine';
    const newPearl: MedicalPearl = {
      id: pearlId,
      subjectId,
      title: cleanTitle || 'High-Yield Clinical Pearl',
      highYieldKey: cleanTitle || 'FMGE Core Concept',
      explanation: content,
      tags: ['AI Mentor', 'High-Yield', subjectName],
      isHighYield: true,
      isBookmarked: true,
    };
    onAddCustomPearl(newPearl);
    setSavedPearlIds((prev) => new Set(prev).add(msgId));
  };

  const handleExportConsultation = (sessionToExport?: CoachSession) => {
    const currentActive = sessions.find((s) => s.id === activeSessionId);
    const targetSession = sessionToExport || currentActive || {
      id: activeSessionId,
      title: currentActive?.title || 'Clinical Consultation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages,
    };
    if (!targetSession || !targetSession.messages || targetSession.messages.length === 0) return;

    let note = `# FMGE Faculty Mentor Consultation Note\n\n`;
    note += `**Consultation Topic:** ${targetSession.title}\n`;
    note += `**Date:** ${new Date(targetSession.updatedAt || targetSession.createdAt).toLocaleDateString('en-IN', { dateStyle: 'full' })}\n`;
    note += `**Student:** ${profile?.displayName || state?.settings?.userName || 'Dr. Aspirant'}\n\n`;
    note += `---\n\n`;

    targetSession.messages.forEach((m) => {
      if (m.role === 'user') {
        note += `### Clinical Inquiry\n${cleanTextForClipboard(m.content)}\n\n`;
      } else if (m.role === 'assistant') {
        note += `### Clinical Faculty Guidance\n${m.content}\n\n---\n\n`;
      }
    });

    const blob = new Blob([note], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (targetSession.title || 'consultation').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    link.download = `fmge-mentor-${sanitizedTitle}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  useEffect(() => {
    let active = true;
    setHistoryReady(false);
    historyUidRef.current = user && !isGuest ? user.uid : null;
    if (!user || isGuest) {
      setHistoryReady(true);
      return () => { active = false; };
    }
    const local = (() => {
      try {
        const parsed = JSON.parse(localStorage.getItem(COACH_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed.filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user')) : [];
      } catch { return []; }
    })();
    void (async () => {
      try {
        const response = await apiFetch('/api/user/documents/coach_sessions');
        if (!response.ok) throw new Error('Unable to load saved consultation history');
        const { document } = await response.json();
        let chosen = Array.isArray(document) ? document : null;
        if (!chosen && local.length) {
          const migrated = await apiFetch('/api/user/documents/coach_sessions/migrate', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document: local }),
          });
          if (!migrated.ok) throw new Error('Unable to migrate consultation history');
          const result = await migrated.json();
          chosen = Array.isArray(result.document) ? result.document : local;
        }
        if (!active || historyUidRef.current !== user.uid) return;
        const valid = (chosen || []).filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user'));
        setSessions(valid);
        setActiveSessionId(valid[0]?.id || `session-${Date.now()}`);
        setMessages(valid[0]?.messages || []);
        localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(valid));
      } catch (error) {
        console.warn('[AiCoach] PostgreSQL history unavailable; showing local cache', error);
        if (active && historyUidRef.current === user.uid) setSessions(local);
      } finally {
        if (active && historyUidRef.current === user.uid) setHistoryReady(true);
      }
    })();
    return () => { active = false; };
  }, [user?.uid, isGuest]);

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

  // Older local history can contain the same completed user/assistant pair
  // twice. Collapse only byte-for-byte identical, adjacent rendered pairs;
  // keep the saved session untouched so an intentional repeated inquiry is
  // never removed from the user's history.
  const displayMessages = useMemo(() => {
    const sameMessage = (a?: ChatMessage, b?: ChatMessage) => {
      if (!a || !b) return false;
      return a.id === b.id || (
        a.role === b.role &&
        a.content === b.content &&
        formatMessageTime(a.timestamp) === formatMessageTime(b.timestamp) &&
        JSON.stringify(a.userAttachedImage || null) === JSON.stringify(b.userAttachedImage || null) &&
        JSON.stringify(a.singleQuiz || null) === JSON.stringify(b.singleQuiz || null)
      );
    };
    const visible: ChatMessage[] = [];
    for (let index = 0; index < messages.length; index += 1) {
      const repeatsPreviousPair =
        visible.length >= 2 &&
        index + 1 < messages.length &&
        visible[visible.length - 2].role !== visible[visible.length - 1].role &&
        sameMessage(messages[index], visible[visible.length - 2]) &&
        sameMessage(messages[index + 1], visible[visible.length - 1]);
      if (repeatsPreviousPair) {
        index += 1;
        continue;
      }
      visible.push(messages[index]);
    }
    return visible;
  }, [messages]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPromptHighlighted, setIsPromptHighlighted] = useState(false);
  
  // Interactive Multi-Question Quiz Mode State
  const [quizSession, setQuizSession] = useState<ActiveQuizSession | null>(null);

  // Gemini API Engine Status & Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [aiStatusUnavailable, setAiStatusUnavailable] = useState(false);

  const checkAiStatus = useCallback(async () => {
    setAiStatusUnavailable(false);
    try {
      const response = await fetch('/api/ai/status');
      if (!response.ok) throw new Error('AI status request failed');
      const data = await response.json();
      if (typeof data?.configured !== 'boolean') throw new Error('AI status response was incomplete');
      setAiConfigured(data.configured);
    } catch {
      setAiConfigured(null);
      setAiStatusUnavailable(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    void checkAiStatus();
  }, [historyReady, checkAiStatus]);

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

  // Audio Read-Aloud state for Faculty Mentor answers
  const [playingFacultyMsgId, setPlayingFacultyMsgId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = speechEngine.subscribe((isPlaying, activeId) => {
      setPlayingFacultyMsgId(isPlaying ? (activeId || null) : null);
    });
    return () => unsubscribe();
  }, []);

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
      mentorContext: state
        ? buildMentorContext(state, {
            activeSession: { id: activeSessionId, messageCount: messages.length },
          })
        : null,
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
        let title = prev[idx]?.title;
        if (!title || title === 'New Consultation' || title === 'Clinical Consultation' || title.endsWith('...')) {
          title = generateMentorSessionTitle(messages, quizSession);
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

        // Strictly persist sessions with actual student questions or active quiz sessions
        const validNext = next.filter((s) => (s.messages && s.messages.some((m) => m.role === 'user')) || Boolean(s.quizSession));
        try {
          localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(validNext));
        } catch (_) {}
        return next;
      });
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, quizSession, activeSessionId, historyReady]);

  useEffect(() => {
    if (!historyReady) return;
    const valid = sessions.filter((s) => (s.messages && s.messages.some((m) => m.role === 'user')) || Boolean(s.quizSession));
    try { localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(valid)); } catch {}
    if (!user || isGuest) return;
    const uid = user.uid;
    void apiFetch('/api/user/documents/coach_sessions', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document: valid }),
    }).catch((error) => console.warn('[AiCoach] Could not sync consultation history', error));
  }, [sessions, historyReady, user?.uid, isGuest]);

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

    const streamController = new AbortController();
    const streamTimeout = setTimeout(() => streamController.abort(), 35000);

    try {
      const streamRes = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: streamController.signal,
        body: JSON.stringify({
          message: promptText,
          history: [{ role: 'user', content: promptText }],
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
            if (newTextAdded && (lastFlush === 0 || now - lastFlush > 50)) {
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
    const cleaned = cleanTextForClipboard(text);
    navigator.clipboard.writeText(cleaned);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleRetry = (query?: string) => {
    if (!query) return;
    setMessages((prev) => prev.filter((m) => !m.isError));
    handleSendMessage(query, true);
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

    // Phase 7: Connect directly to existing Study & Practice engines
    if (lowerText.includes('review topic in study') || lowerText.includes('review in study') || lowerText.includes('practice this topic in study')) {
      if (onNavigateToStudy) {
        const resolved = resolveMedicalTopic(text);
        const subId = resolved?.subjectId || 'medicine';
        onNavigateToStudy(subId, resolved?.canonicalTopic);
        setIsLoading(false);
        return;
      }
    }

    if (lowerText.includes('give me 20 questions') || lowerText.includes('practice in qbank') || lowerText.includes('launch practice session')) {
      if (onLaunchPracticeSession) {
        const resolved = resolveMedicalTopic(text);
        const subId = resolved?.subjectId || 'medicine';
        const topName = resolved?.canonicalTopic || 'Clinical Medicine';
        const topId = topName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
        onLaunchPracticeSession(subId, topId, topName);
        setIsLoading(false);
        return;
      }
    }

    const lastQuestionMsg = [...newMessages].reverse().find(m => m.singleQuiz);
    const lastQ = lastQuestionMsg?.singleQuiz;

    if (lastQ && (lowerText.includes('other options') || lowerText.includes('why wrong') || lowerText.includes('why incorrect') || lowerText.includes('distractor') || lowerText.includes('why the other') || lowerText.includes('why others'))) {
      const qCorrectKey = lastQ.correctKey || (lastQ as any).correctAnswer || 'A';
      const db = lastQ.distractorBreakdown || lastQ.distractorExplanations || {};
      let distractorContent = `### Detailed Analysis: Why Other Options Are Wrong\n\n`;
      distractorContent += `**Clinical Question:** ${lastQ.question}\n\n`;
      distractorContent += `**Correct Answer:** Option ${qCorrectKey} (${lastQ.options.find(o => o.key === qCorrectKey)?.text || ''})\n\n`;
      distractorContent += `---\n\n`;

      const incorrectOpts = lastQ.options.filter(o => o.key !== qCorrectKey);
      if (incorrectOpts.length > 0) {
        incorrectOpts.forEach(opt => {
          const reason = db[opt.key] || `Option ${opt.key} is not the primary diagnostic or therapeutic choice for this presentation.`;
          distractorContent += `#### Option ${opt.key}: ${opt.text}\n`;
          distractorContent += `**Why it is incorrect:** ${reason}\n\n`;
        });
      } else if (Object.keys(db).length > 0) {
        Object.entries(db).forEach(([k, exp]) => {
          distractorContent += `#### Option ${k}\n`;
          distractorContent += `**Why it is incorrect:** ${exp}\n\n`;
        });
      }

      if (lastQ.fmgeTakeaway) {
        distractorContent += `> **FMGE High-Yield Takeaway:** ${lastQ.fmgeTakeaway}\n\n`;
      }
      if (lastQ.memoryHook) {
        distractorContent += `**Memory Hook:** ${lastQ.memoryHook}`;
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
      let correctContent = `### Why Option ${qCorrectKey} is Correct\n\n`;
      correctContent += `**Correct Option ${qCorrectKey}:** ${correctOptText}\n\n`;
      correctContent += `**Clinical Explanation:**\n${lastQ.explanation}\n\n`;
      if (lastQ.fmgeTakeaway) {
        correctContent += `> **FMGE High-Yield Takeaway:** ${lastQ.fmgeTakeaway}\n\n`;
      }
      if (lastQ.memoryHook) {
        correctContent += `**Memory Hook:** ${lastQ.memoryHook}`;
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
      lower.includes('give me mcq') ||
      lower.includes('mcq') ||
      lower.includes('vignette') ||
      lower.includes('quiz') ||
      lower.includes('batch') ||
      lower.includes('test me') ||
      lower.includes('drill me') ||
      lower.includes('challenge');

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
      const streamTimeout = setTimeout(() => streamController.abort(), 35000); // 35s max timeout

      try {
        const streamRes = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: streamController.signal,
          body: JSON.stringify({
            message: isGoldenHourActive ? `[Golden Hour High-Yield Mode]: ${text}` : text,
            history: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            studentContext: {
              ...computedStudentContext,
              goldenHourActive: isGoldenHourActive,
            },
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
              if (newTextAdded && (lastFlush === 0 || now - lastFlush > 50)) {
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
            // Guard: if response contains an MCQ vignette, intercept it into an interactive card so answers stay hidden
            const parsed = parseMcqFromMarkdown(accumulated);
            if (parsed) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId
                    ? {
                        ...msg,
                        content: parsed.cleanedText,
                        singleQuiz: parsed.quiz,
                      }
                    : msg
                )
              );
            } else {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId ? { ...msg, content: accumulated } : msg
                )
              );
            }
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
        } else if (res.status === 429) {
          throw new Error('Dr. AI is currently reviewing heavy case volume from medical aspirants. Please wait a moment and tap retry below.');
        } else {
          try {
            const errData = await res.json();
            if (errData?.error === 'RATE_LIMITED' || errData?.message?.includes('case volume')) {
              throw new Error(errData.message);
            }
          } catch (parseE: any) {
            if (parseE?.message?.includes('Dr. AI')) throw parseE;
          }
        }
      } catch (fetchErr: any) {
        if (fetchErr?.message?.includes('Dr. AI')) throw fetchErr;
        console.warn('[AI Coach] Remote fetch failed, utilizing resilient offline synthesis:', fetchErr);
      }

      // If backend provided a multi-question interactive quiz session
      if (data?.quizSession && Array.isArray(data.quizSession.questions) && data.quizSession.questions.length > 1) {
        const quizTitle = data.quizSession.title || 'Interactive Clinical Drill';
        const qCount = data.quizSession.questions.length;
        const topicName = data.topic || data.quizSession.topic || 'High-Yield Clinical Medicine';
        
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply || `Starting an interactive **${qCount}-question clinical drill** on **${topicName}**. Test your diagnostic approach below:`,
          timestamp: new Date(),
          suggestedFollowUps: [
            `Give me another drill on ${topicName}`,
            'Explain the core pathophysiological mechanism',
            'What is the gold standard diagnostic test?'
          ],
        };

        setMessages([...newMessages, assistantMsg]);
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

      let replyText =
        data?.reply ||
        (singleQuizPayload
          ? `Here is an authentic clinical MCQ on **${singleQuizPayload.subject}** (${singleQuizPayload.topic}):`
          : `### Clinical High-Yield Review: ${text}\n\n**Core Approach:**\n- **Investigation of Choice:** Evaluate with first-line clinical examination and primary imaging/labs.\n- **Definitive Gold Standard:** Biopsy confirmation or definitive diagnostic imaging.\n- **Drug of Choice / Protocol:** Standard evidence-based guidelines for FMGE.\n\n> **FMGE Exam Pearl:** Review key differential diagnoses and classic exam buzzwords in your Error Notebook.`);

      let finalQuiz = singleQuizPayload;
      if (!finalQuiz && replyText) {
        const parsed = parseMcqFromMarkdown(replyText, 'General Medicine', 'Clinical Medicine');
        if (parsed) {
          replyText = parsed.cleanedText;
          finalQuiz = parsed.quiz;
        }
      }

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
        singleQuiz: finalQuiz || undefined,
        suggestedFollowUps: followUps,
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err: any) {
      const isFriendlyClinical = err?.message?.includes('Dr. AI') || err?.message?.includes('case volume') || err?.message?.includes('AI Service Notice');
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: isFriendlyClinical
          ? err.message
          : 'Unable to reach Faculty Mentor right now. Please check your connection or tap retry below.',
        timestamp: new Date(),
        isError: true,
        retryQuery: text,
      };
      setMessages([...newMessages, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Single Question Answer Handler
  const handleSingleQuizAnswer = (msgId: string, selectedKey: string) => {
    const targetMsg = messages.find((m) => m.id === msgId && m.singleQuiz);
    if (targetMsg && targetMsg.singleQuiz) {
      const isCorrect = selectedKey === targetMsg.singleQuiz.correctKey;
      const resolved = resolveMedicalTopic(targetMsg.singleQuiz.topic) || resolveMedicalTopic(targetMsg.singleQuiz.subject);
      const resolvedSubId = resolved?.subjectId || targetMsg.singleQuiz.subject.toLowerCase().replace(/[^a-z]/g, '') || 'medicine';
      const resolvedTopicName = resolved?.canonicalTopic || targetMsg.singleQuiz.topic || 'Clinical Vignette';
      const resolvedTopicId = resolvedTopicName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);

      if (onRecordAttempt) {
        onRecordAttempt({
          questionId: targetMsg.singleQuiz.id,
          subjectId: resolvedSubId,
          topicId: resolvedTopicId,
          topicName: resolvedTopicName,
          subtopic: targetMsg.singleQuiz.topic,
          isCorrect,
          selectedAnswer: selectedKey,
          correctAnswer: targetMsg.singleQuiz.correctKey,
          timeTakenSeconds: 45,
          difficulty: 'high-yield',
          source: 'mentor' as any,
          notes: targetMsg.singleQuiz.stem || targetMsg.singleQuiz.question,
          isImageBased: Boolean(targetMsg.singleQuiz.imageUrl),
          imageCategory: targetMsg.singleQuiz.imageAsset?.imageCategory,
          imageUrl: targetMsg.singleQuiz.imageUrl,
          imageAssetId: targetMsg.singleQuiz.imageAsset?.assetId,
        });
      }
    }

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.singleQuiz) {
          return {
            ...msg,
            singleQuiz: {
              ...msg.singleQuiz,
              userAnswer: selectedKey,
            },
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
    const resolvedQ = resolveMedicalTopic(currentQ.topic) || resolveMedicalTopic(currentQ.subject);
    const resolvedSubId = resolvedQ?.subjectId || currentQ.subject.toLowerCase().replace(/[^a-z]/g, '') || 'medicine';
    const resolvedTopicName = resolvedQ?.canonicalTopic || currentQ.topic || 'Clinical Topic';
    const resolvedTopicId = resolvedTopicName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);

    if (onRecordAttempt) {
      onRecordAttempt({
        questionId: currentQ.id,
        subjectId: resolvedSubId,
        topicId: resolvedTopicId,
        topicName: resolvedTopicName,
        subtopic: currentQ.topic,
        isCorrect,
        selectedAnswer: selectedKey,
        correctAnswer: currentQ.correctKey,
        timeTakenSeconds: 35,
        difficulty: 'high-yield',
        source: 'mentor' as any,
        notes: currentQ.stem || currentQ.question,
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

  const handleQuickAskNew = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }

    setIsPromptHighlighted(true);
    setTimeout(() => setIsPromptHighlighted(false), 2200);
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
        JSON.stringify(filtered.filter((s) => (s.messages && s.messages.some((m) => m.role === 'user')) || Boolean(s.quizSession)))
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

  const handleTogglePinSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s
      );
      try {
        localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
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

  const executeClearUnpinnedHistory = () => {
    const kept = sessions.filter((s) => s.isPinned);
    try {
      localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(kept));
    } catch (_) {}
    setSessions(kept);
    if (kept.length > 0) {
      if (!kept.some((s) => s.id === activeSessionId)) {
        handleSelectSession(kept[0]);
      }
    } else {
      handleNewSession();
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || {
    id: activeSessionId,
    title: messages.length === 0 ? 'New Consultation' : 'Current Consultation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages,
  };

  // Dynamic contextual quick prompt chips based on current consultation topic
  const quickActions = useMemo(() => {
    if (messages.length > 0) {
      const recentText = messages.slice(-3).map((m) => m.content).join(' ').toLowerCase();

      if (recentText.includes('sjögren') || recentText.includes('sjogren')) {
        return [
          { label: 'Sjögren vs SLE', query: 'Compare Sjögren syndrome vs Systemic Lupus Erythematosus: clinical discriminators, autoantibodies, and biopsy findings.' },
          { label: 'Give me 5 harder MCQs', query: 'Give me 5 harder clinical MCQs on Sjögren syndrome with distractor analysis.' },
          { label: 'Autoimmune Rapid Revision', query: 'Provide a high-yield rapid revision of rheumatological and autoimmune diseases for FMGE.' },
          { label: 'Biopsy Criteria', query: 'Explain the salivary gland biopsy scoring criteria (Chisholm-Mason) for Sjögren syndrome.' },
        ];
      }

      if (recentText.includes('crohn') || recentText.includes('colitis') || recentText.includes('ibd')) {
        return [
          { label: 'Crohn’s vs UC', query: 'What is the difference between Crohn\'s disease and ulcerative colitis?' },
          { label: 'Give me harder IBD MCQs', query: 'Give me 5 harder clinical MCQs on inflammatory bowel disease with distractor analysis.' },
          { label: 'Test me on IBD complications', query: 'Test me on classic complications of Crohn\'s vs Ulcerative Colitis (strictures, fistulas, toxic megacolon, cancer risk).' },
          { label: 'Step-up Drug Therapy', query: 'What are the first-line and biologic drugs of choice for Crohn\'s disease vs Ulcerative Colitis?' },
        ];
      }

      if (recentText.includes('heart block') || recentText.includes('arrhythmia') || recentText.includes('ecg')) {
        return [
          { label: 'Mobitz I vs Mobitz II', query: 'Explain Mobitz type I vs type II second-degree AV block ECG discriminators, atropine response, and prognosis.' },
          { label: 'DOC in Complete Heart Block', query: 'What is the acute and definitive management for Complete Heart Block?' },
          { label: '5 ECG Spotters', query: 'Give me 5 clinical vignette MCQs testing high-yield FMGE ECG patterns with distractor analysis.' },
          { label: 'WPW Syndrome Clues', query: 'Explain Wolff-Parkinson-White syndrome triad on ECG and contraindicated drugs.' },
        ];
      }

      if (recentText.includes('nephrotic') || recentText.includes('nephritic') || recentText.includes('glomerul')) {
        return [
          { label: 'MCD vs FSGS', query: 'Compare Minimal Change Disease vs Focal Segmental Glomerulosclerosis on biopsy and steroid response.' },
          { label: '5 Glomerular MCQs', query: 'Give me 5 high-yield clinical MCQs on Glomerulonephritis with distractor analysis.' },
          { label: 'Biopsy Electron Microscopy', query: 'Review classic electron microscopy findings in nephrotic and nephritic syndromes for FMGE.' },
          { label: 'PSGN vs IgA Nephropathy', query: 'Explain PSGN vs IgA nephropathy timeline, complement levels, and management.' },
        ];
      }

      // Check if last question has a topic
      const lastQ = [...messages].reverse().find((m) => m.singleQuiz)?.singleQuiz;
      if (lastQ?.topic) {
        return [
          { label: `5 harder ${lastQ.topic} MCQs`, query: `Give me 5 harder clinical MCQs on ${lastQ.topic} with distractor analysis.` },
          { label: `FMGE Traps in ${lastQ.topic}`, query: `What are the most common FMGE exam traps and pitfalls in ${lastQ.topic}?` },
          { label: `Clinical Differentials`, query: `What are the top clinical differential diagnoses for ${lastQ.topic}?` },
          { label: `Diagnostic Pearls`, query: `Summarize the high-yield diagnostic criteria and drugs of choice for ${lastQ.topic}.` },
        ];
      }
    }

    // Default landing prompts grounded in student's real weak areas
    const topWeak = computedStudentContext.weakSubjects[0] || 'General Medicine';
    return [
      { label: `Quiz me on ${topWeak}`, query: `Quiz me on high-yield clinical questions from ${topWeak} with distractor analysis.` },
      { label: 'Explain Nephrotic Syndrome', query: 'Explain nephrotic syndrome with high-yield points, biopsy findings, and classic exam traps.' },
      { label: 'Crohn’s vs Ulcerative Colitis', query: 'What is the difference between Crohn\'s disease and ulcerative colitis?' },
      { label: 'MCQ on Heart Blocks', query: 'Give me an FMGE clinical MCQ on heart blocks with distractor analysis.' },
    ];
  }, [messages, computedStudentContext.weakSubjects]);

  // Contextual consultation starters using real application data (never fabricated)
  const reducedMotion = useReducedMotion();

  const contextualStarters = useMemo<Starter[]>(() => {
    // 1. Explain a Concept: intelligently suggests the student's actual logged weak topic or recent error
    const weakTopic = computedStudentContext.weakTopics[0];
    const weakSub = computedStudentContext.weakSubjects[0];
    const conceptStarter = weakTopic
      ? {
          category: 'Weak Topic Focus',
          hue: 'red' as const,
          icon: Brain,
          title: `Master ${weakTopic}`,
          description: `Pathophysiology, clinical presentation, and high-yield FMGE diagnostic criteria in ${weakSub || 'Medicine'}.`,
          query: `Explain ${weakTopic} in ${weakSub || 'General Medicine'} with high-yield FMGE diagnostic criteria, biopsy findings, and classic exam traps.`,
        }
      : {
          category: 'Concept Deep-Dive',
          hue: 'blue' as const,
          icon: Brain,
          title: 'Nephrotic vs Nephritic Syndrome',
          description: 'Pathophysiology, clinical hallmarks, and biopsy/urinalysis discriminators.',
          query: 'Explain the pathophysiology and clinical hallmarks of Nephrotic vs Nephritic Syndrome, including diagnostic urinalysis criteria.',
        };

    // 2. Compare Two Conditions
    const compareStarter = {
      category: 'Condition Comparison',
      hue: 'purple' as const,
      icon: Stethoscope,
      title: 'Crohn’s vs Ulcerative Colitis',
      description: 'Endoscopy findings, skip lesions, histology, and high-yield complications.',
      query: 'Compare Crohn’s Disease vs Ulcerative Colitis: clinical features, endoscopy findings, histology, and high-yield complications.',
    };

    // 3. Clinical MCQ Challenge: Contextual when close to exam
    const isExamClose = typeof daysRemaining === 'number' && daysRemaining <= 30;
    const mcqStarter = {
      category: isExamClose ? 'High-Yield Exam Focus' : 'Clinical MCQ Challenge',
      hue: (isExamClose ? 'red' : 'orange') as MentorHueKey,
      icon: Award,
      title: 'Clinical MCQ Challenge',
      description: isExamClose
        ? 'High-yield exam-pattern clinical vignette on AV dissociation and Heart Blocks.'
        : 'AV dissociation and heart block vignette with distractor analysis.',
      query: 'Give me a high-yield clinical vignette MCQ on AV dissociation and Heart Blocks with distractor analysis.',
    };

    // 4. Targeted Subject Quiz: Contextual based on real weak subjects
    const topWeakList = computedStudentContext.weakSubjects.slice(0, 2);
    const quizStarter = topWeakList.length > 0
      ? {
          category: 'Weak Area Targeted',
          hue: 'green' as const,
          icon: Activity,
          title: `Targeted Quiz: ${topWeakList.join(' & ')}`,
          description: `5 high-yield clinical questions tailored to your tracked performance in ${topWeakList.join(', ')}.`,
          query: `Quiz me on 5 high-yield clinical MCQs from my weakest subjects (${topWeakList.join(', ')}) with faculty distractor analysis.`,
        }
      : {
          category: 'Targeted Clinical Quiz',
          hue: 'green' as const,
          icon: Activity,
          title: 'Targeted Subject Quiz',
          description: '5 high-yield clinical questions tailored to weak subjects.',
          query: 'Quiz me on 5 high-yield clinical MCQs from my weakest subjects with faculty distractor analysis.',
        };

    return [conceptStarter, compareStarter, mcqStarter, quizStarter];
  }, [computedStudentContext, daysRemaining]);

  return (
    <div
      data-accent="mentor"
      className="mentor-workspace w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5 pb-24 sm:pb-20 lg:pb-16 font-sans text-slate-900"
    >
      {/* ================= EDITORIAL FACULTY MENTOR HEADER ================= */}
      <MentorHeader
        daysRemaining={state?.settings?.examDate ? daysRemaining : null}
        sessionsCount={sessions.length}
        activeSessionTitle={activeSession?.title}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewSession={handleNewSession}
        isGoldenHourMode={isGoldenHourActive}
        onToggleGoldenHour={() => setIsGoldenHourActive((prev) => !prev)}
        onOpenKeyConfig={() => setIsKeyModalOpen(true)}
        isAiConfigured={aiConfigured}
        isAiStatusUnavailable={aiStatusUnavailable}
        onCheckAiStatus={checkAiStatus}
        activeMode={quizSession ? 'quiz' : 'consultation'}
        onModeChange={(mode) => {
          if (mode === 'consultation') {
            if (quizSession) setQuizSession(null);
            setTimeout(() => textareaRef.current?.focus(), 50);
          } else if (mode === 'quiz') {
            startQuizMode();
          } else if (mode === 'viva') {
            if (quizSession) setQuizSession(null);
            handleSendMessage(
              'Conduct a high-yield FMGE bedside Viva with me. Present a 35yo patient presenting in the emergency room with acute symptoms. Give me ONLY the initial scenario and ask for my immediate first step. Wait for my answer, then critique and proceed to stage 2.'
            );
          }
        }}
        onBackToOverview={onClose}
      />



      {/* Render AI Engine Notice Banner (shown only if GEMINI_API_KEY is not configured on server) */}
      {aiConfigured === false && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-amber-500" />
            <p className="t-caption text-amber-900">
              <strong className="font-semibold">Gemini API key required.</strong> Faculty
              reasoning is running offline on this server — connect a key for real-time AI.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsKeyModalOpen(true)}
            className="shrink-0 whitespace-nowrap"
          >
            Connect key
          </Button>
        </div>
      )}

      {/* ================= MAIN CLINICAL CONSULTATION WORKSPACE ================= */}
      <main className="w-full min-w-0 space-y-5">
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

      {/* 3. Main Clinical Consultation Workspace Card — Apple HIG Layered Surface */}
      <div className="mentor-chat-shell relative flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-black/[0.06] bg-[#FBFBFD] shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] h-[calc(100dvh-250px)] min-h-[400px] sm:h-[calc(100dvh-185px)] sm:min-h-[540px] max-h-[850px]">
        {/* Scrollable Conversational Message Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="mentor-messages-scroller flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-6 scroll-smooth overscroll-contain relative"
        >
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full px-2 py-4 sm:py-6"
            >
              <div className="flex items-center justify-between pb-3.5 max-w-3xl mx-auto px-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#007AFF] animate-pulse" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#6E6E73]">
                    High-Yield Clinical Scenarios
                  </span>
                </div>
                <span className="text-[12px] text-[#8E8E93] font-medium hidden sm:inline">
                  Select a scenario to start consultation
                </span>
              </div>

              {/* Bento Grid: 2x2 Clean Apple Bento Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto">
                {contextualStarters.map((starter, sIdx) => {
                  const Icon = starter.icon;
                  const h = MENTOR_HUES[starter.hue];
                  return (
                    <motion.button
                      key={sIdx}
                      type="button"
                      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { ...SPRING_SMOOTH, delay: Math.min(sIdx * 0.045, 0.3) }
                      }
                      whileHover={
                        reducedMotion ? undefined : { y: -3, transition: SPRING_SMOOTH }
                      }
                      whileTap={
                        reducedMotion ? undefined : { scale: 0.985, transition: SPRING_SNAPPY }
                      }
                      onClick={() => handleSendMessage(starter.query)}
                      className={cn(
                        'group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] bg-white p-5 text-left',
                        'shadow-[0_2px_8px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.02)]',
                        'hover:border-black/[0.12] transition-all duration-200 cursor-pointer',
                        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <span
                            aria-hidden="true"
                            className="grid size-10 shrink-0 place-items-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105"
                            style={{
                              background: h.tint,
                              border: `1px solid color-mix(in srgb, ${h.bar} 24%, transparent)`,
                            }}
                          >
                            <Icon className="size-5 stroke-[2]" style={{ color: h.bar }} />
                          </span>
                          <span
                            className="text-[11px] font-semibold tracking-normal px-2.5 py-0.5 rounded-full"
                            style={{
                              background: h.tint,
                              color: h.bar,
                            }}
                          >
                            {starter.category}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[15px] sm:text-[16px] font-bold leading-snug text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                            {starter.title}
                          </div>
                          <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-[#6E6E73] line-clamp-2">
                            {starter.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between pt-3 border-t border-black/[0.05] text-[12px] font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                        <span>Start consultation</span>
                        <span className="grid size-6 place-items-center rounded-full bg-black/[0.04] group-hover:bg-[#007AFF] group-hover:text-white transition-all">
                          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            displayMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
            className="mentor-message-row w-full flex justify-start"
          >
            {/* User Bubble */}
            {msg.role === 'user' ? (
              <div className="flex items-start gap-2.5 sm:gap-3 max-w-2xl sm:max-w-3xl justify-start">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-ink)] text-[11px] font-semibold text-white">
                  {userInitials}
                </div>
                <div className="flex min-w-0 max-w-full flex-col items-start gap-1">
                  <div className="max-w-full space-y-2 break-words rounded-2xl border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,white)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-ink)] sm:px-5 sm:py-3">
                    {msg.userAttachedImage && (
                      <div
                        className="group relative max-w-xs cursor-zoom-in overflow-hidden rounded-xl border border-[var(--color-hairline)] bg-black"
                        onClick={() => setActiveModalImage({ isOpen: true, imageUrl: msg.userAttachedImage!.url, title: msg.userAttachedImage!.fileName || 'Uploaded Medical Investigation' })}
                      >
                        <img
                          src={msg.userAttachedImage.url}
                          alt={msg.userAttachedImage.fileName || 'Attached Investigation'}
                          className="max-h-48 w-full rounded-xl object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Maximize2 className="size-3.5" />
                          <span>Click to zoom</span>
                        </div>
                      </div>
                    )}
                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                    <div className="t-num-xxs flex items-center justify-end gap-1 pt-0.5 text-[var(--color-ink-4)]">
                      <span>{formatMessageTime(msg.timestamp)}</span>
                      <CheckCheck className="size-3.5 text-accent" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Faculty Mentor Card */
              <div className="flex w-full items-start gap-2.5 sm:gap-3">
                <IconTile icon={GraduationCap} size={32} color="var(--accent)" className="mt-0.5 rounded-full" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="mentor-message-toolbar flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pb-1">
                    <div className="mentor-message-byline flex min-w-0 flex-1 flex-col">
                      <span className="t-section text-[var(--color-ink)]">Faculty Mentor</span>
                      {isLoading && !msg.content ? (
                        <div className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-accent">
                          <span className="sr-only">Faculty Mentor: Reviewing the clinical reasoning…</span>
                          <span aria-hidden="true">Reviewing the clinical reasoning…</span>
                          <span className="inline-flex items-center gap-1" aria-hidden="true">
                            <span className="size-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
                            <span className="size-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '150ms' }} />
                            <span className="size-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '300ms' }} />
                          </span>
                        </div>
                      ) : isLoading && msg.content ? (
                        <div className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-accent">
                          <span>Responding…</span>
                          <span className="inline-flex gap-1 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          </span>
                        </div>
                      ) : (
                        <span className="mentor-message-caption text-[11px] text-slate-400 font-sans">Clinical Faculty · High-Yield FMGE</span>
                      )}
                    </div>

                    <div className="mentor-message-actions flex shrink-0 items-center gap-1">
                      {onAddCustomPearl && msg.content && (
                        <button
                          type="button"
                          onClick={() => handleSaveToPearls(msg.id, msg.content)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-700 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-teal-50 active:scale-95"
                          title="Save key clinical takeaway to Pearls Vault"
                          aria-label="Save to Pearls Vault"
                        >
                          {savedPearlIds.has(msg.id) ? (
                            <>
                              <BookmarkCheck className="h-3.5 w-3.5 text-teal-600" />
                              <span className="mentor-action-label text-teal-600 font-medium text-[11px]">Saved to Pearls</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-3.5 w-3.5" />
                              <span className="mentor-action-label text-[11px]">Save as Pearl</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Hands-free Audio Read-Aloud Button */}
                      {msg.content && (
                        <button
                          type="button"
                          onClick={() => {
                            if (playingFacultyMsgId === msg.id) {
                              speechEngine.stop();
                            } else {
                              speechEngine.speak(msg.id, msg.content);
                            }
                          }}
                          className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer px-2 py-1 rounded-lg active:scale-95 ${
                            playingFacultyMsgId === msg.id
                              ? 'text-teal-800 bg-teal-100/90 font-bold animate-pulse'
                              : 'text-slate-400 hover:text-teal-700 hover:bg-teal-50'
                          }`}
                          title={playingFacultyMsgId === msg.id ? 'Stop audio' : 'Listen to Faculty answer'}
                          aria-label="Listen to answer"
                        >
                          {playingFacultyMsgId === msg.id ? (
                            <>
                              <Volume2 className="h-3.5 w-3.5 text-teal-700" />
                              <span className="mentor-action-label text-[11px] text-teal-700">Listening...</span>
                            </>
                          ) : (
                            <>
                              <VolumeX className="h-3.5 w-3.5" />
                              <span className="mentor-action-label text-[11px]">Listen</span>
                            </>
                          )}
                        </button>
                      )}

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
                              <span className="mentor-action-label text-emerald-600 font-medium text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span className="mentor-action-label text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Proper Markdown Output via MarkdownRenderer, Error Notice with Retry, or Streaming Indicator */}
                  {msg.isError ? (
                    <div className="space-y-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
                      <div className="flex items-center gap-2 text-amber-900">
                        <IconTile icon={AlertCircle} size={22} color="var(--color-warn-ink)" />
                        <span className="t-section">Faculty Mentor notice</span>
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--color-ink-2)]">{msg.content}</p>
                      {msg.retryQuery && (
                        <Button variant="primary" size="sm" onClick={() => handleRetry(msg.retryQuery)}>
                          <RotateCw className="size-3.5" />
                          Try again
                        </Button>
                      )}
                    </div>
                  ) : msg.content ? (
                    <div className="transition-opacity duration-200">
                      <MarkdownRenderer content={msg.content} className="mentor-answer" />

                      {/* Contextual High-Yield Active Recall Chips */}
                      {!isLoading && !msg.isError && msg.content && (
                        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[var(--color-hairline-soft)] pt-3">
                          <span className="t-eyebrow text-[var(--color-ink-4)]">Active Recall:</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleSendMessage(
                                'Generate a high-yield FMGE clinical vignette MCQ on this topic with 4 options (A, B, C, D) and distractor analysis.'
                              )
                            }
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:brightness-95 active:scale-[0.97]"
                            style={chipStyle(RECALL_HUE.mcq)}
                            title="Test your recall with an exam-style MCQ"
                          >
                            <HelpCircle className="size-3" />
                            <span>Quiz me on this</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSendMessage(
                                'What are the common FMGE examiner traps, high-yield look-alikes, and distractor pitfalls for this condition?'
                              )
                            }
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:brightness-95 active:scale-[0.97]"
                            style={chipStyle(RECALL_HUE.traps)}
                            title="See common exam tricks and traps"
                          >
                            <ShieldAlert className="size-3" />
                            <span>FMGE Traps</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSendMessage(
                                'What is the first-line Drug of Choice (DOC) and emergency management protocol for this condition according to latest guidelines?'
                              )
                            }
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:brightness-95 active:scale-[0.97]"
                            style={chipStyle(RECALL_HUE.doc)}
                            title="First-line pharmacotherapy & management"
                          >
                            <Pill className="size-3" />
                            <span>DOC & Protocol</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,white)] px-4 py-3 text-xs font-medium text-accent">
                      <span className="relative flex size-2.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
                      </span>
                      <span className="font-semibold">Reviewing clinical guidelines and differential points…</span>
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
                    onAddErrorItem={onAddErrorItem}
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
                        className="flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-hairline)] bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink-2)] shadow-e1 transition-colors hover:border-accent/30 hover:text-[var(--color-ink)] active:scale-[0.97] disabled:opacity-50"
                      >
                        <span className="max-w-[260px] truncate sm:max-w-lg">{followUp}</span>
                        <ArrowRight className="size-3 shrink-0 text-[var(--color-ink-4)]" />
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
      <div className="relative z-20 shrink-0 border-t border-[var(--color-hairline)] bg-white px-3 py-2 sm:px-5 sm:py-2.5">
        {/* Soft upward scrim so scrolling text fades smoothly behind the bar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-7 inset-x-0 h-7 bg-gradient-to-t from-white via-white/80 to-transparent"
        />

        {/* Quick "Ask New" Jump Button — only shown when user is scrolled up away from bottom */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              type="button"
              initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.88 }}
              transition={
                reducedMotion ? { duration: 0 } : { ...SPRING_SNAPPY, mass: 0.7 }
              }
              whileHover={reducedMotion ? undefined : { scale: 1.04, transition: SPRING_SNAPPY }}
              whileTap={reducedMotion ? undefined : { scale: 0.94, transition: SPRING_SNAPPY }}
              onClick={handleQuickAskNew}
              className="group absolute -top-11 right-5 z-30 flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--accent)_38%,transparent)] transition-transform hover:brightness-105 active:scale-95 sm:right-7"
              title="Jump to ask bar to ask something new"
              aria-label="Ask new question"
            >
              <motion.span
                className="inline-flex"
                {...(reducedMotion
                  ? {}
                  : { whileHover: { rotate: 90 }, transition: SPRING_SNAPPY })}
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </motion.span>
              <span className="text-[11px] font-semibold">Ask new</span>
              <span className="sr-only">Latest message</span>
              <ChevronDown className="size-3.5 text-white/80 transition-transform group-hover:translate-y-0.5" />
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
          onSetInputQuery={(q) => setInputQuery(q)}
        />
      </div>
      </div>
      </main>

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
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onClearAllHistory={executeClearAllHistory}
        onClearUnpinnedHistory={executeClearUnpinnedHistory}
        formatRelativeDate={formatRelativeDate}
        onExportSession={handleExportConsultation}
      />

      {/* Gemini AI Engine Key & Status Modal */}
      <AiKeyConfigModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyConfigured={() => {
          setAiConfigured(true);
        }}
      />
    </div>
  );
};
