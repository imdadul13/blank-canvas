import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Target,
  Smile,
  Calendar,
  BookmarkCheck,
  Volume2,
  VolumeX,
  Check,
  Lightbulb,
  Settings,
  BookOpen,
  Bell,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { DailyTask, DailyStudyLog, AppState } from '../types';
import { motion } from 'motion/react';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { getPersonalizedDailyPlan, PersonalizedPlanTask } from '../utils/personalizationEngine';
import { calculateStudyStreak } from '../utils/dailyMissionEngine';

interface DailyPlannerViewProps {
  state: AppState;
  onAddTask: (task: DailyTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateDailyLog: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string, subtopic?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onBackToOverview?: () => void;
}

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  state,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateDailyLog,
  onLaunchPracticeSession,
  onNavigateTab,
  onBackToOverview,
}) => {
  const { profile } = useAuth();
  const todayStr = getLocalDateKey();
  const todayLog = state.studyLogs[todayStr] || {
    date: todayStr,
    studyMinutes: 0,
    questionsSolved: 0,
    completedTaskIds: [],
    mood: 'great',
  };

  // Personalized plan for today
  const dailyPlan = useMemo(() => getPersonalizedDailyPlan(profile, state), [profile, state]);

  // Streak calculation
  const streakDays = useMemo(() => calculateStudyStreak(state.studyLogs), [state.studyLogs]);

  // View state & tabs
  const [mobileTab, setMobileTab] = useState<'planner' | 'focus'>('planner');
  const [showSettings, setShowSettings] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showCompletedAccordion, setShowCompletedAccordion] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('psm');
  const [newTaskType, setNewTaskType] = useState<DailyTask['type']>('qbank');
  const [newTaskDuration, setNewTaskDuration] = useState(45);
  const [newTaskPriority, setNewTaskPriority] = useState<DailyTask['priority']>('high');

  // Pomodoro & Timer State
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'short_break' | 'long_break' | 'stopwatch'>('pomodoro');
  const [totalDuration, setTotalDuration] = useState(25 * 60); // Total seconds for active mode
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Seconds left
  const [isRunning, setIsRunning] = useState(false);
  const [soundMode, setSoundMode] = useState<'off' | 'alpha' | 'whitenoise' | 'rain'>('off');

  // Currently Focused Study Task
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Ambient Web Audio context ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Tasks derivation
  const tasks = useMemo(() => state.dailyTasks || [], [state.dailyTasks]);
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const totalTaskCount = tasks.length;
  const completedTaskCount = completedTasks.length;
  const progressPercent = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;

  // Top Priority Task
  const topPriorityTask = useMemo(() => {
    // 1. Check pending tasks with high priority
    const highPriPending = pendingTasks.find((t) => t.priority === 'high');
    if (highPriPending) return highPriPending;

    // 2. Check any pending task
    if (pendingTasks.length > 0) return pendingTasks[0];

    // 3. Fallback to personalized plan task
    if (dailyPlan.tasks && dailyPlan.tasks.length > 0) {
      const pTask = dailyPlan.tasks[0];
      return {
        id: `plan-${pTask.id}`,
        title: pTask.topicName,
        subjectId: pTask.subjectId,
        topicName: pTask.topicName,
        type: 'qbank' as const,
        durationMinutes: pTask.durationMinutes || 45,
        completed: false,
        priority: 'high' as const,
      };
    }

    return null;
  }, [pendingTasks, dailyPlan.tasks]);

  // Determine current active study task in Focus Engine
  const activeFocusTask = useMemo(() => {
    if (activeTaskId) {
      const found = tasks.find((t) => t.id === activeTaskId);
      if (found) return found;
    }
    return topPriorityTask;
  }, [activeTaskId, tasks, topPriorityTask]);

  // Greeting & Date display
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Doctor.';
    if (hour < 17) return 'Good afternoon, Doctor.';
    return 'Good evening, Doctor.';
  }, []);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (timerMode === 'stopwatch') {
          setTimeLeft((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              stopAmbientSound();
              if (timerMode === 'pomodoro') {
                const addMinutes = Math.round(totalDuration / 60);
                onUpdateDailyLog(todayStr, {
                  studyMinutes: (todayLog.studyMinutes || 0) + addMinutes,
                });
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, todayLog.studyMinutes, todayStr, totalDuration, onUpdateDailyLog]);

  // Ambient Web Audio Handler
  const startAmbientSound = (type: 'alpha' | 'whitenoise' | 'rain') => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopAmbientSound();

      if (type === 'alpha') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 200;
        osc2.frequency.value = 210;
        gain.gain.value = 0.04;
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        noiseNodeRef.current = gain;
      } else {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.value = type === 'rain' ? 800 : 1200;

        const gain = ctx.createGain();
        gain.gain.value = 0.03;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noiseNodeRef.current = gain;
      }
    } catch (e) {
      console.error('Web Audio error:', e);
    }
  };

  const stopAmbientSound = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
  };

  const handleSoundToggle = (mode: 'off' | 'alpha' | 'whitenoise' | 'rain') => {
    setSoundMode(mode);
    if (mode === 'off') {
      stopAmbientSound();
    } else {
      startAmbientSound(mode);
    }
  };

  const handleModeChange = (mode: 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch', customSeconds?: number) => {
    setIsRunning(false);
    setTimerMode(mode);
    let sec = 25 * 60;
    if (mode === 'pomodoro') sec = customSeconds || 25 * 60;
    else if (mode === 'short_break') sec = 5 * 60;
    else if (mode === 'long_break') sec = 15 * 60;
    else if (mode === 'stopwatch') sec = 0;

    setTotalDuration(sec);
    setTimeLeft(sec);
  };

  const handleStopTimer = () => {
    setIsRunning(false);
    stopAmbientSound();
    setTimeLeft(totalDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular gauge calculations
  const radius = 72;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useMemo(() => {
    if (timerMode === 'stopwatch') return 0;
    if (totalDuration === 0) return 0;
    const progressRatio = Math.max(0, Math.min(1, timeLeft / totalDuration));
    return circumference * (1 - progressRatio);
  }, [timeLeft, totalDuration, timerMode, circumference]);

  // Start Now on Top Priority Task
  const handleStartTopPriority = (task: DailyTask | null) => {
    if (!task) return;
    setActiveTaskId(task.id);
    handleModeChange('pomodoro', (task.durationMinutes || 25) * 60);
    setIsRunning(true);
    setMobileTab('focus');

    // If it's a launchable practice session topic, student can launch directly
    if (task.subjectId && onLaunchPracticeSession) {
      const topicId = (task as any).topicId || `${task.subjectId}-1`;
      onLaunchPracticeSession(task.subjectId, topicId, task.title);
    }
  };

  // Add plan tasks to checklist
  const handlePopulateFromPlan = () => {
    const existingTitles = new Set(tasks.map((t) => t.title));
    dailyPlan.tasks
      .filter((t) => !existingTitles.has(t.topicName))
      .slice(0, 4)
      .forEach((t) => {
        onAddTask({
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: t.topicName,
          subjectId: t.subjectId,
          topicName: t.topicName,
          type: 'qbank',
          durationMinutes: t.durationMinutes || 40,
          completed: false,
          priority: t.priority >= 66 ? 'high' : 'medium',
        });
      });
  };

  // Handle task form submit
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: DailyTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      subjectId: newTaskSubject,
      type: newTaskType,
      durationMinutes: Number(newTaskDuration) || 45,
      completed: false,
      priority: newTaskPriority,
    };

    onAddTask(task);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  // Progress metrics calculation for "Today's Progress"
  const totalStudyMinutes = todayLog.studyMinutes || 0;
  const studyHours = Math.floor(totalStudyMinutes / 60);
  const studyRemainingMins = totalStudyMinutes % 60;
  const studyTimeFormatted = studyHours > 0 ? `${studyHours}h ${studyRemainingMins}m` : `${studyRemainingMins}m`;

  const uniqueSubjectsCount = useMemo(() => {
    const subs = new Set<string>();
    tasks.forEach((t) => {
      if (t.subjectId) subs.add(t.subjectId);
    });
    return Math.max(subs.size, completedTaskCount > 0 ? 1 : 0);
  }, [tasks, completedTaskCount]);

  const dailyGoalHours = state.settings.dailyStudyHourGoal || 6;
  const dailyGoalPercent = Math.min(100, Math.round((totalStudyMinutes / (dailyGoalHours * 60)) * 100));

  // High-Yield Focus Tips rotating list
  const focusTips = [
    'Eliminate distractions. 25 minutes of deep focus is more powerful than hours of scattered study.',
    'Review key clinical tables right after solving MCQs to solidify active recall.',
    'Active recall produces 2.5x higher retention than passive reading of notes.',
    'Focus on understanding the pathophysiology behind the diagnosis, not just memorizing the buzzword.',
  ];
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  return (
    <div
      className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 animate-in fade-in duration-150 pb-44 lg:pb-16 text-slate-900"
      style={{
        paddingBottom: 'calc(max(1rem, env(safe-area-inset-bottom, 1rem)) + 145px)',
      }}
    >
      {/* 1. Header & Greeting Area — Animated Hero Card */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-[#FAF9F5] via-[#FCFCFA] via-45% to-[#F4F9F6] p-4 sm:px-6 sm:py-3.5 shadow-xs"
      >
        {/* Dynamic Animated Ambient Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">

          {/* Soft glowing corner radial gradient orbs with breathing motion */}
          <motion.div
            animate={{
              scale: [1, 1.18, 1],
              opacity: [0.35, 0.6, 0.35],
              x: [0, 16, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/35 via-orange-200/25 to-transparent blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
              y: [0, -10, 0],
            }}
            transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-16 -left-12 h-60 w-60 rounded-full bg-gradient-to-tr from-emerald-300/25 via-teal-100/20 to-transparent blur-3xl"
          />

          {/* Subtle Coordinate Grid */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.03] text-amber-950 pointer-events-none select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="planner-hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.75" />
                <circle cx="28" cy="28" r="0.75" fill="currentColor" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#planner-hero-grid)" />
          </svg>

          {/* Premium Chrono-Sanctorum Sunlit Astrolabe & Morning Window Artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-[500px] overflow-hidden opacity-25 sm:opacity-35 md:opacity-[0.42] select-none pointer-events-none block">
            <svg viewBox="0 0 520 145" className="w-full h-full" fill="none" preserveAspectRatio="xMaxYMid meet">
              <defs>
                <linearGradient id="planner-window-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#D1FAE5" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="planner-brass-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="45%" stopColor="#D97706" />
                  <stop offset="85%" stopColor="#B45309" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
                <linearGradient id="planner-hills" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#064E3B" stopOpacity="0.85" />
                </linearGradient>
                <radialGradient id="planner-sun-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient Morning Solar Glow */}
              <motion.circle
                cx="420"
                cy="46"
                r="65"
                fill="url(#planner-sun-glow)"
                animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* ═══ 1. ARCHED WINDOW WITH MORNING SUNRISE VIEW ═══ */}
              <g transform="translate(390, 15)">
                {/* Window Sky Backdrop */}
                <path
                  d="M -50 40 A 50 50 0 0 1 50 40 L 50 120 L -50 120 Z"
                  fill="url(#planner-window-sky)"
                />

                {/* Distant Dawn Rolling Hills through Window */}
                <path
                  d="M -50 85 Q -20 68 15 78 Q 35 72 50 85 L 50 120 L -50 120 Z"
                  fill="url(#planner-hills)"
                />

                {/* Rising Dawn Sun on Horizon */}
                <circle cx="15" cy="68" r="12" fill="#F59E0B" />
                <motion.circle
                  cx="15"
                  cy="68"
                  r="20"
                  stroke="#FDE68A"
                  strokeWidth="1.2"
                  fill="none"
                  animate={{ scale: [1, 1.6], opacity: [0.75, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
                />

                {/* Architectural Arched Window Frame */}
                <path
                  d="M -50 40 A 50 50 0 0 1 50 40 L 50 125 L -50 125 Z"
                  stroke="#B45309"
                  strokeWidth="4"
                  strokeOpacity="0.4"
                  fill="none"
                />
                {/* Window Pane Muntin Bars */}
                <line x1="0" y1="-10" x2="0" y2="120" stroke="#B45309" strokeWidth="1.6" strokeOpacity="0.35" />
                <line x1="-50" y1="50" x2="50" y2="50" stroke="#B45309" strokeWidth="1.6" strokeOpacity="0.35" />
              </g>

              {/* Study Desk Window Sill Base */}
              <rect x="220" y="132" width="300" height="13" fill="#78350F" opacity="0.45" rx="2" />
              <line x1="220" y1="132" x2="520" y2="132" stroke="#B45309" strokeWidth="1.5" opacity="0.6" />

              {/* ═══ 2. BRASS CELESTIAL ASTROLABE / ARMILLARY SPHERE ═══ */}
              <g transform="translate(455, 95)">
                {/* Turned Brass Base Stanchion */}
                <path d="M -8 37 L 8 37 L 4 24 L -4 24 Z" fill="url(#planner-brass-metal)" />
                <rect x="-12" y="35" width="24" height="3" rx="1.5" fill="url(#planner-brass-metal)" />

                {/* Outer Astrolabe Ring with Meridian Ticks */}
                <circle r="26" stroke="url(#planner-brass-metal)" strokeWidth="2.2" fill="none" />
                {/* Meridian Axis Pivot */}
                <line x1="0" y1="-26" x2="0" y2="24" stroke="url(#planner-brass-metal)" strokeWidth="1.6" />

                {/* Rotating Inclined Ecliptic Band Ring */}
                <motion.ellipse
                  cx="0"
                  cy="0"
                  rx="24"
                  ry="9"
                  stroke="url(#planner-brass-metal)"
                  strokeWidth="1.8"
                  fill="none"
                  transform="rotate(-28)"
                  animate={{ rotate: [-28, 332] }}
                  transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                />

                {/* Equatorial Ring */}
                <ellipse cx="0" cy="0" rx="22" ry="7" stroke="url(#planner-brass-metal)" strokeWidth="1.2" fill="none" opacity="0.75" />

                {/* Central Terrestrial Solar Sphere */}
                <circle r="4.5" fill="#F59E0B" />
                <circle r="1.5" fill="#FFFFFF" />
              </g>

              {/* ═══ 3. CLASSICAL FOCUS HOURGLASS ON DESK ═══ */}
              <g transform="translate(340, 102)">
                {/* Top Wooden Base Plate */}
                <rect x="-14" y="-24" width="28" height="3.5" rx="1" fill="#78350F" stroke="#B45309" strokeWidth="0.8" />
                {/* Bottom Wooden Base Plate */}
                <rect x="-14" y="26" width="28" height="3.5" rx="1" fill="#78350F" stroke="#B45309" strokeWidth="0.8" />
                {/* Side Supporting Struts */}
                <line x1="-11" y1="-21" x2="-11" y2="26" stroke="#B45309" strokeWidth="1.2" />
                <line x1="11" y1="-21" x2="11" y2="26" stroke="#B45309" strokeWidth="1.2" />

                {/* Glass Bulbs Silhouette */}
                <path
                  d="M -9 -21 L 9 -21 C 7 -4, 2 -2, 0 1 C -2 -2, -7 -4, -9 -21 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.4"
                  stroke="#FDE68A"
                  strokeWidth="0.9"
                />
                <path
                  d="M 0 1 C 2 4, 7 6, 9 26 L -9 26 C -7 6, -2 4, 0 1 Z"
                  fill="#FFFFFF"
                  fillOpacity="0.4"
                  stroke="#FDE68A"
                  strokeWidth="0.9"
                />

                {/* Upper Sand Chamber */}
                <path d="M -7 -14 Q 0 -6 7 -14 L 0 0 Z" fill="#F59E0B" opacity="0.85" />

                {/* Trickling Golden Sand Stream */}
                <motion.line
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="18"
                  stroke="#F59E0B"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  animate={{ strokeDashoffset: [0, -12] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />

                {/* Lower Accumulated Sand Pile */}
                <path d="M -7 25 Q 0 16 7 25 Z" fill="#F59E0B" opacity="0.9" />
              </g>

              {/* ═══ 4. STEAMING MORNING TEA / COFFEE MUG ═══ */}
              <g transform="translate(285, 118)">
                {/* Porcelain Cup Body */}
                <rect x="-8" y="0" width="16" height="14" rx="2" fill="#FFFFFF" stroke="#0F766E" strokeWidth="0.8" />
                {/* Handle */}
                <path d="M -8 3 C -13 3, -13 11, -8 11" stroke="#0F766E" strokeWidth="1.2" fill="none" />

                {/* Rising Fragrant Steam Curl 1 */}
                <motion.path
                  d="M -3 0 Q -7 -8 -2 -14 Q 3 -20 -1 -26"
                  stroke="#FDE68A"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                  animate={{
                    y: [0, -4, 0],
                    opacity: [0.2, 0.75, 0.2],
                  }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Rising Fragrant Steam Curl 2 */}
                <motion.path
                  d="M 3 -2 Q 7 -9 2 -16 Q -2 -22 2 -28"
                  stroke="#FDE68A"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  fill="none"
                  animate={{
                    y: [0, -5, 0],
                    opacity: [0.15, 0.65, 0.15],
                  }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Foreground Content — Minimal & Premium Editorial Layout */}
        <div className="relative z-10 flex flex-col gap-3 sm:gap-3.5">
          {/* Top Eyebrow & Status Cluster */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold font-mono tracking-wider">
              <span className="text-stone-500 uppercase text-[11px]">PLANNER</span>
              <span className="text-stone-300">•</span>
              <span className="text-teal-800 font-bold uppercase text-[11px] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DAILY FOCUS
              </span>
              <span className="text-stone-300 hidden sm:inline">•</span>
              <span className="text-stone-500 font-sans text-xs hidden sm:inline normal-case font-medium">
                {greeting}
              </span>
            </div>

            {/* Quick Metadata Cluster */}
            <div className="flex items-center gap-2">
              {/* Today's Date */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-stone-200/80 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-xs">
                <Calendar className="w-3 h-3 text-[#00685F]" />
                <span>{formattedDate}</span>
              </div>

              {/* Active Streak */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50/90 border border-orange-200/80 text-xs font-bold text-orange-700 shadow-2xs">
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                <span>{streakDays}d</span>
              </div>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#00685F] to-[#0F766E] text-white shadow-md shadow-teal-950/15 shrink-0">
              <Calendar className="h-5 w-5 text-white stroke-[1.75]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl lg:text-[25px] font-semibold text-slate-900 tracking-tight leading-snug">
                Today’s Plan &amp; Focus
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 leading-normal line-clamp-1 sm:line-clamp-none">
                Focus on high-yield mastery. One intentional milestone at a time.
              </p>
            </div>
          </div>

          {/* Minimal Integrated Telemetry Strip */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-2 border-t border-stone-200/60 text-xs">
            {/* Planned / Progress */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00685F] flex items-center justify-center shrink-0 border border-teal-100/80">
                <BookmarkCheck className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-[11px] text-stone-400 font-sans">Tasks:</span>
                <span className="font-bold text-slate-900 text-xs sm:text-[13px]">{completedTaskCount}/{totalTaskCount}</span>
                <span className="text-teal-700 font-medium text-[11px]">({progressPercent}%)</span>
              </div>
            </div>

            <span className="text-stone-300 hidden sm:inline">•</span>

            {/* Study Time */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100/80">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-[11px] text-stone-400 font-sans">Focus Time:</span>
                <span className="font-bold text-slate-900 text-xs sm:text-[13px]">{studyTimeFormatted}</span>
                <span className="text-stone-400 text-[11px]">/ {dailyGoalHours}h</span>
              </div>
            </div>

            <span className="text-stone-300 hidden md:inline">•</span>

            {/* Goal % */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-[11px] text-stone-400 font-sans">Daily Goal:</span>
                <span className="font-bold text-emerald-700 text-xs sm:text-[13px]">{dailyGoalPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 2. Sub-Header Controls & View Calendar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Mobile Tab Switcher: Only displayed on smaller screens where columns are tabbed */}
        <div className="lg:hidden inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('planner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'planner'
                ? 'bg-[#00685f] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Daily Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('focus')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'focus'
                ? 'bg-[#00685f] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Focus Engine</span>
          </button>
        </div>

        {/* View Calendar CTA */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowCalendarModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200/80 hover:border-stone-300 text-stone-700 hover:text-stone-900 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#00685f]" />
            <span>View Calendar</span>
          </button>
        </div>
      </div>

      {/* 3. Main Dual Column Workspace (Desktop 2-Column, Mobile Tabbed/Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== LEFT COLUMN: DAILY PLANNER ===================== */}
        <div
          className={`lg:col-span-7 space-y-6 ${
            mobileTab === 'planner' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Card 1: Today's Personalized Plan + Top Priority */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-6">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ECF7F5] text-[#00685f] shrink-0 mt-0.5">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Today’s Personalized Plan
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Curated from your weak areas, revision cycle, and exam timeline.
                  </p>
                </div>
              </div>

              {/* Add Task Button */}
              <button
                type="button"
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* TOP PRIORITY Study Task Box */}
            {topPriorityTask ? (
              <div className="rounded-2xl p-5 bg-[#FAF7F5] border border-rose-200/80 space-y-3.5 relative overflow-hidden transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-rose-700">
                      TOP PRIORITY
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider border border-rose-200">
                    High Impact
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {topPriorityTask.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {(() => {
                      const sub = FMGE_SUBJECTS.find((s) => s.id === topPriorityTask.subjectId);
                      return `${sub?.name || 'General Medicine'} • High-yield topic • R1 Revision`;
                    })()}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-rose-100">
                  <div className="flex items-center gap-4 text-xs text-stone-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{topPriorityTask.durationMinutes || 45} min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                      <span>Study + QBank</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartTopPriority(topPriorityTask)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00685f] hover:bg-[#005049] text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-stretch sm:self-auto"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Now</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
                <p className="text-xs text-stone-600">All planned tasks completed for today!</p>
                <button
                  type="button"
                  onClick={handlePopulateFromPlan}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00685f] text-white text-xs font-bold hover:bg-[#005049]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Load More From Syllabus Plan</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Today's Tasks List with Progress */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-5">
            {/* Header with Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#ECF7F5] text-[#00685f]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Today’s Tasks ({totalTaskCount})
                    </h2>
                    <p className="text-xs text-stone-500">
                      {completedTaskCount} of {totalTaskCount} completed
                    </p>
                  </div>
                </div>

                <span className="text-sm font-mono font-extrabold text-slate-700">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00685f] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Task List Items */}
            {tasks.length > 0 ? (
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const sub = FMGE_SUBJECTS.find((s) => s.id === task.subjectId);
                  const isCompleted = task.completed;
                  const isActive = activeTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group ${
                        isActive
                          ? 'border-[#00685f] bg-teal-50/30 ring-1 ring-[#00685f]/20'
                          : isCompleted
                          ? 'border-stone-200/70 bg-stone-50/50'
                          : 'border-stone-200/80 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-label={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-[#00685f] text-white'
                              : 'border-2 border-stone-300 hover:border-stone-500 bg-white'
                          }`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Title & Metadata */}
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            setActiveTaskId(task.id);
                            if (!isRunning) {
                              handleModeChange('pomodoro', (task.durationMinutes || 25) * 60);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-xs sm:text-sm font-bold leading-snug truncate ${
                                isCompleted ? 'line-through text-stone-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-medium flex-wrap">
                            <span>{sub?.name || 'General Medicine'}</span>
                            <span>•</span>
                            <span className="capitalize">{task.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Duration & Status Pill */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{task.durationMinutes} min</span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                              : 'bg-amber-50 text-amber-800 border-amber-200/90'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          className="text-stone-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
                <BookmarkCheck className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">
                  No tasks planned for today yet. Add high-yield study goals or load from your personalized plan.
                </p>
                <button
                  type="button"
                  onClick={handlePopulateFromPlan}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00685f] hover:bg-[#005049] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Load Today's Personalized Plan</span>
                </button>
              </div>
            )}

            {/* Completed Tasks Accordion */}
            {completedTaskCount > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCompletedAccordion(!showCompletedAccordion)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Completed Tasks ({completedTaskCount})</span>
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-stone-400 transition-transform ${
                      showCompletedAccordion ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {showCompletedAccordion && (
                  <div className="mt-2 space-y-2 pl-6 pt-1">
                    {completedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="text-xs text-stone-500 flex items-center justify-between py-1 border-b border-stone-100 last:border-none"
                      >
                        <span className="line-through">{t.title}</span>
                        <span className="font-mono text-[10px] text-emerald-700">✓ Done</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===================== RIGHT COLUMN: FOCUS ENGINE ===================== */}
        <div
          className={`lg:col-span-5 space-y-6 ${
            mobileTab === 'focus' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-6">
            {/* Luminous Top Shimmer Track */}
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/25 to-transparent" />
              <motion.div
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
                className="w-36 sm:w-56 h-full bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf]"
              />
            </div>

            {/* Card Header with Rotating Gyroscope & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="relative p-2.5 rounded-2xl bg-teal-50/90 text-[#00685f] shrink-0 mt-0.5 border border-teal-200/70 shadow-2xs">
                  {/* Rotating focus ring reticle */}
                  <motion.div
                    animate={{ rotate: isRunning ? 360 : 0 }}
                    transition={isRunning ? { duration: 12, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
                    className="absolute inset-0 rounded-2xl border border-dashed border-teal-400/60 pointer-events-none"
                  />
                  <motion.div
                    animate={isRunning ? { scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Clock className="w-5 h-5 relative z-10" />
                  </motion.div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      Focus Engine
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border transition-colors ${
                        isRunning
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                        }`}
                      />
                      {isRunning
                        ? timerMode === 'pomodoro'
                          ? 'Deep Flow'
                          : timerMode === 'stopwatch'
                          ? 'Timer Running'
                          : 'Break'
                        : 'Standby'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Deep work. Better retention. Real progress.
                  </p>
                </div>
              </div>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  showSettings
                    ? 'bg-stone-100 border-stone-300 text-stone-900 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 shadow-2xs'
                }`}
                title="Timer Settings & Ambient Sound"
              >
                <motion.div animate={{ rotate: showSettings ? 90 : 0 }} transition={{ duration: 0.25 }}>
                  <Settings className="w-3.5 h-3.5" />
                </motion.div>
                <span className="text-[11px] font-bold hidden sm:inline">Settings</span>
              </button>
            </div>

            {/* Settings Accordion Panel */}
            {showSettings && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 animate-in fade-in duration-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] font-mono">
                    Ambient Audio Synthesizer
                  </span>
                  <span className="text-[10px] text-stone-400">Web Audio API</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                  {[
                    { id: 'off', label: 'Off' },
                    { id: 'alpha', label: 'Alpha' },
                    { id: 'rain', label: 'Rain' },
                    { id: 'whitenoise', label: 'Noise' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSoundToggle(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                        soundMode === s.id
                          ? 'bg-[#00685f] text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
                  <span>Session Length:</span>
                  <div className="flex items-center gap-1">
                    {[25, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleModeChange('pomodoro', mins * 60)}
                        className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold ${
                          totalDuration === mins * 60 && timerMode === 'pomodoro'
                            ? 'bg-[#00685f] text-white'
                            : 'bg-white border border-stone-200 text-stone-600'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Circular Timer Display */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  {/* Background Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    className="stroke-stone-100"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Active Progress Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    className="stroke-[#00685f] transition-all duration-300 ease-linear"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Inside Circle Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#00685f]">
                    {timerMode === 'pomodoro'
                      ? 'FOCUS'
                      : timerMode === 'short_break'
                      ? 'SHORT BREAK'
                      : timerMode === 'long_break'
                      ? 'LONG BREAK'
                      : 'STOPWATCH'}
                  </span>

                  <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                    {formatTime(timeLeft)}
                  </div>

                  <span className="text-xs text-stone-400 font-medium">
                    {isRunning ? 'Stay focused' : timeLeft === 0 ? 'Session Complete' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Study Task Banner */}
            {activeFocusTask && (
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ECF7F5] text-[#00685f] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {activeFocusTask.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate">
                    {(() => {
                      const sub = FMGE_SUBJECTS.find((s) => s.id === activeFocusTask.subjectId);
                      return `${sub?.name || 'General Medicine'} • Study & QBank`;
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* Timer Control Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {/* Start / Pause */}
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="col-span-1 py-2.5 px-3 rounded-xl bg-[#00685f] hover:bg-[#005049] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>

              {/* 5 min Break */}
              <button
                type="button"
                onClick={() => handleModeChange('short_break')}
                className={`col-span-1 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  timerMode === 'short_break'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                5m Break
              </button>

              {/* 15 min Break */}
              <button
                type="button"
                onClick={() => handleModeChange('long_break')}
                className={`col-span-1 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  timerMode === 'long_break'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                15m Break
              </button>

              {/* Stop / Reset */}
              <button
                type="button"
                onClick={handleStopTimer}
                className="col-span-1 py-2.5 px-3 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                title="Stop and Reset"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>

            {/* Focus Tip Card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-amber-200/70 flex items-center justify-center text-amber-800">
                  <Lightbulb className="w-3 h-3" />
                </div>
                <span>Focus Tip</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed pl-7">
                {focusTips[currentTipIndex]}
              </p>
            </div>

            {/* Today's Progress Section */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today’s Progress</h3>
                <p className="text-xs text-stone-400">Small steps create big results.</p>
              </div>

              {/* 4 Metric Tiles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Tasks completed */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
                  <div className="text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-base font-extrabold text-slate-900">
                    {completedTaskCount}/{totalTaskCount}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Tasks completed</div>
                </div>

                {/* 2. Study time */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
                  <div className="text-[#00685f]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-base font-extrabold text-slate-900">
                    {studyTimeFormatted}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Study time</div>
                </div>

                {/* 3. Subjects covered */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
                  <div className="text-sky-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-base font-extrabold text-slate-900">
                    {uniqueSubjectsCount}
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Subjects covered</div>
                </div>

                {/* 4. Daily goal */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
                  <div className="text-rose-600">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-base font-extrabold text-slate-900">
                    {dailyGoalPercent}%
                  </div>
                  <div className="text-[10px] text-stone-500 font-medium">Daily goal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Focus Engine Dock: visible when browsing Daily Planner to keep large timer as main interface when in Focus tab */}
      {mobileTab === 'planner' && (
        <div
          className="lg:hidden fixed z-40 left-3.5 right-3.5 max-w-md mx-auto"
          style={{
            bottom: 'calc(max(1rem, env(safe-area-inset-bottom, 1rem)) + 54px)',
          }}
          aria-label="Focus Engine Quick Controls"
        >
          <div className="px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.10)] flex items-center justify-between gap-3 font-['Plus_Jakarta_Sans']">
            {/* Left: Tappable to open the full Focus Engine */}
            <button
              type="button"
              onClick={() => setMobileTab('focus')}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
              title="Open full Focus Engine"
            >
              <div className="w-8 h-8 rounded-full bg-[#ECF7F5] text-[#00685f] flex items-center justify-center shrink-0 group-hover:bg-[#d8f0ec] transition-colors">
                <Clock className="w-4 h-4 text-[#00685f]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    Focus Engine
                  </span>
                  {isRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  )}
                </div>
                <div className="font-mono text-sm font-extrabold text-slate-900 leading-tight">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </button>

            {/* Right: Quick Controls (Start/Pause, Stop) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Play / Pause Circular Button */}
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="w-10 h-10 rounded-full bg-[#00685f] hover:bg-[#005049] text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                title={isRunning ? 'Pause Focus Session' : 'Start Focus Session'}
                aria-label={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Stop Square Button */}
              <button
                type="button"
                onClick={handleStopTimer}
                className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="Stop and Reset Session"
                aria-label="Stop Session"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {showAddTask &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">Add Today’s Study Task</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Plan a high-yield study or MCQ block.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solve 50 MCQs of Cardiology ECGs"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00685f] focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Subject</label>
                    <select
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                      className="w-full h-10 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                    >
                      {FMGE_SUBJECTS.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} (~{sub.weightage}M)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Task Type</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="w-full h-10 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="qbank">QBank / MCQs</option>
                      <option value="video">Video / Notes</option>
                      <option value="revision">Rapid Revision</option>
                      <option value="gt_review">GT Review</option>
                      <option value="pearls">High-Yield Pearls</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Duration (Minutes)</label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full h-10 px-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00685f] hover:bg-[#005049] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* MODAL: VIEW CALENDAR & STREAK */}
      {showCalendarModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00685f]">
                    STUDY CONSISTENCY CALENDAR
                  </span>
                  <h3 className="text-xl font-bold font-serif text-slate-900 mt-0.5">
                    Daily Study Habit Tracker
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Streak Hero Card */}
              <div className="p-4 rounded-2xl bg-[#ECF7F5] border border-[#CBEBE5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900">
                      {streakDays} Day Study Streak
                    </div>
                    <div className="text-xs text-stone-500">
                      {streakDays >= 3 ? 'Excellent momentum! Keep it going.' : 'Log at least 30m every day.'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white text-[#00685f] border border-[#CBEBE5]">
                  {streakDays > 0 ? 'ACTIVE' : 'START TODAY'}
                </span>
              </div>

              {/* Today's Stats Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
                    Today's Study Hours
                  </span>
                  <div className="font-mono text-lg font-bold text-slate-900">
                    {(todayLog.studyMinutes / 60).toFixed(1)} / {state.settings.dailyStudyHourGoal}h
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
                    MCQs Solved Today
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={todayLog.questionsSolved}
                      onChange={(e) =>
                        onUpdateDailyLog(todayStr, { questionsSolved: Number(e.target.value) })
                      }
                      className="w-20 font-mono text-lg font-bold text-slate-900 bg-white border border-stone-200 rounded-lg px-2 py-0.5"
                    />
                    <span className="text-stone-400 font-mono text-xs">Qs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
