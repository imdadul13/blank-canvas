import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Target,
  Calendar,
  BookmarkCheck,
  Check,
  Lightbulb,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  X,
  Headphones,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { DailyTask, DailyStudyLog, AppState } from '../types';
import { motion } from 'motion/react';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { getPersonalizedDailyPlan } from '../utils/personalizationEngine';
import { calculateStudyStreak } from '../utils/dailyMissionEngine';
import { useCircadianTheme } from '../hooks/useCircadianTheme';
import { CircadianFocusDropdown } from './CircadianFocusDropdown';

interface DailyPlannerViewProps {
  state: AppState;
  onAddTask: (task: DailyTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateDailyLog: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string, subtopic?: string) => void;
  onNavigateTab?: (tab: string) => void;
  onBackToOverview?: () => void;
  onOpenZenFocus?: () => void;
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
  onOpenZenFocus,
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
  const circadian = useCircadianTheme(state.settings?.bgTheme);

  // View state & tabs
  const [mobileTab, setMobileTab] = useState<'planner' | 'focus'>('planner');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
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

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'pending') return pendingTasks;
    if (taskFilter === 'completed') return completedTasks;
    return tasks;
  }, [taskFilter, tasks, pendingTasks, completedTasks]);

  // Recommended high-yield tasks from dailyPlan not yet in tasks
  const recommendedPlanTasks = useMemo(() => {
    const existingTitles = new Set(tasks.map((t) => t.title.toLowerCase().trim()));
    return (dailyPlan.tasks || [])
      .filter((t) => !existingTitles.has(t.topicName.toLowerCase().trim()))
      .slice(0, 3);
  }, [dailyPlan.tasks, tasks]);

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

  // Greeting & Date display (unified with circadian state)
  const greeting = `${circadian.greeting} Doctor.`;

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
    const existingTitles = new Set(tasks.map((t) => t.title.toLowerCase().trim()));
    dailyPlan.tasks
      .filter((t) => !existingTitles.has(t.topicName.toLowerCase().trim()))
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

  // Add a single recommended topic from dailyPlan
  const handleAddSinglePlanTask = (t: typeof dailyPlan.tasks[0]) => {
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
      {/* 1. Header & Greeting Area — Apple Luminous Hero Card */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(255,149,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] border border-orange-200/50"
        style={{
          background: 'linear-gradient(135deg, #FFF9F2 0%, #FFF1E0 35%, #FFE2C2 70%, #FFD4A3 100%)',
        }}
      >
        {/* Soft Ambient Glow */}
        <div
          className="absolute right-0 top-0 bottom-0 w-3/5 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 85% 45%, rgba(255,149,0,0.20) 0%, rgba(255,107,0,0.06) 50%, transparent 75%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          {/* Top Bar: Back to Dashboard, Eyebrow & Metadata Cluster */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {onBackToOverview && (
                <button
                  type="button"
                  onClick={onBackToOverview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 hover:bg-white text-[#1D1D1F] border border-[rgba(60,60,67,0.10)] shadow-xs transition-all cursor-pointer"
                  title="Return to Home Dashboard"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Dashboard</span>
                </button>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[rgba(60,60,67,0.08)] text-xs font-semibold text-[#FF9500]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                <span className="uppercase tracking-wider text-[11px] font-bold">Daily Focus</span>
                <span className="text-[#C7C7CC]">·</span>
                <span className="text-[#3C3C43] font-normal hidden sm:inline">{greeting}</span>
              </div>
            </div>

            {/* Quick Metadata Cluster */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <CircadianFocusDropdown circadian={circadian} align="right" isDark={false} />

              {/* Today's Date */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/80 backdrop-blur-md border border-[rgba(60,60,67,0.10)] text-[#1D1D1F] shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-[#FF9500]" />
                <span>{formattedDate}</span>
              </div>

              {/* Active Streak */}
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/80 backdrop-blur-md border border-orange-200/80 text-[#FF9500] shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-[#FF9500] text-[#FF9500]" />
                <span>{streakDays}d streak</span>
              </div>
            </div>
          </div>

          {/* Main Hero Row: Title & Subtitle + Interactive Mini Chrono Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-xl min-w-0">
              <h1 className="text-[36px] sm:text-[46px] lg:text-[52px] font-black tracking-[-0.04em] leading-[0.92] text-[#1D1D1F]">
                Today’s Plan <br />
                <span className="text-[#FF9500]">&amp; Clinical Focus</span>
              </h1>
              <p className="text-[14px] sm:text-[15px] font-medium text-[#3C3C43] leading-snug">
                Focus on high-yield mastery. One intentional milestone at a time.
              </p>
            </div>

            {/* Right Mini Goal Gauge Widget */}
            <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex items-center gap-4 sm:gap-5 shrink-0 max-w-sm">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" stroke="#F2F2F7" strokeWidth="4.5" fill="none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#FF9500"
                    strokeWidth="4.5"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 * (1 - dailyGoalPercent / 100)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#1D1D1F]">{dailyGoalPercent}%</span>
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF9500]">Daily Target</span>
                  <span className="text-[10px] text-[#8E8E93]">({dailyGoalHours}h Goal)</span>
                </div>
                <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                  {studyTimeFormatted} logged today
                </div>
                <div className="text-[11px] text-[#8E8E93] truncate">
                  {completedTaskCount} of {totalTaskCount} tasks finished
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Strip: Apple frosted glass row */}
          <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-[#1D1D1F]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/80 border border-white/90 shadow-2xs flex items-center justify-center text-[#FF9500]">
                <BookmarkCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-[11px] font-sans font-medium text-[#6E6E73]">Tasks:</span>
                <span className="font-bold text-xs text-[#1D1D1F]">{completedTaskCount}/{totalTaskCount}</span>
                <span className="font-bold text-[11px] text-[#FF9500]">({progressPercent}%)</span>
              </div>
            </div>

            <span className="text-[#C7C7CC] hidden sm:inline">·</span>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/80 border border-white/90 shadow-2xs flex items-center justify-center text-[#007AFF]">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-[11px] font-sans font-medium text-[#6E6E73]">Focus Time:</span>
                <span className="font-bold text-xs text-[#1D1D1F]">{studyTimeFormatted}</span>
                <span className="text-[11px] font-sans text-[#8E8E93]">/ {dailyGoalHours}h</span>
              </div>
            </div>

            <span className="text-[#C7C7CC] hidden sm:inline">·</span>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/80 border border-white/90 shadow-2xs flex items-center justify-center text-[#30D158]">
                <Target className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-[11px] font-sans font-medium text-[#6E6E73]">Daily Goal:</span>
                <span className="font-bold text-xs text-[#30D158]">{dailyGoalPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 2. Sub-Header Controls & View Calendar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Mobile Tab Switcher */}
        <div className="lg:hidden inline-flex p-1 bg-[#E5E5EA] rounded-full border border-[rgba(60,60,67,0.08)] shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('planner')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === 'planner'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-[#007AFF]" />
            <span>Daily Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('focus')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              mobileTab === 'focus'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#FF9500]" />
            <span>Focus Engine</span>
          </button>
        </div>

        {/* View Calendar CTA */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowCalendarModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-[#F2F2F7] border border-[rgba(60,60,67,0.10)] text-[#1D1D1F] text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>View Calendar</span>
          </button>
        </div>
      </div>

      {/* 3. Main Dual Column Workspace (Desktop 2-Column, Mobile Tabbed/Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== LEFT COLUMN: DAILY ROADMAP & TASKS ===================== */}
        <div
          className={`lg:col-span-7 space-y-6 ${
            mobileTab === 'planner' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[rgba(60,60,67,0.10)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            {/* Header: Title, Progress count, and Add Task CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/15 shrink-0 mt-0.5 shadow-2xs">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] leading-snug">
                      Daily Roadmap & Tasks
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#F2F2F7] text-[#6E6E73] font-mono text-[10px] font-semibold border border-[rgba(60,60,67,0.10)]">
                      {completedTaskCount}/{totalTaskCount} Done
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] mt-0.5 leading-relaxed font-medium">
                    Personalized study queue prioritized by FMGE weightage & retention curve.
                  </p>
                </div>
              </div>

              {/* Add Task Button */}
              <button
                type="button"
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.6]" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Apple Progress Track */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-[#8E8E93]">Daily Completion Progress</span>
                <span className="font-mono text-[#1D1D1F]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#007AFF] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* TOP PRIORITY MISSION CARD */}
            {topPriorityTask && (
              <div className="rounded-2xl p-5 bg-gradient-to-br from-[#FFF5F2] via-white to-white border border-[#FF3B30]/20 shadow-[0_2px_12px_rgba(255,59,48,0.06)] space-y-3.5 relative overflow-hidden transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center shrink-0">
                      <Target className="w-3.5 h-3.5 stroke-[2.4]" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF3B30]">
                      TOP PRIORITY MISSION
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold uppercase tracking-wider border border-[#FF3B30]/20">
                    High Impact
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] leading-snug">
                    {topPriorityTask.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#8E8E93] font-medium flex-wrap">
                    {(() => {
                      const sub = FMGE_SUBJECTS.find((s) => s.id === topPriorityTask.subjectId);
                      return (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-[#1D1D1F] font-semibold">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sub?.color || '#007AFF' }}
                            />
                            {sub?.name || 'General Medicine'}
                          </span>
                          <span>•</span>
                          <span>High-yield topic</span>
                          <span>•</span>
                          <span>R1 Revision</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[rgba(255,59,48,0.12)]">
                  <div className="flex items-center gap-4 text-xs text-[#6E6E73] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8E8E93]" />
                      <span>{topPriorityTask.durationMinutes || 45} min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#8E8E93]" />
                      <span>Study + QBank</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartTopPriority(topPriorityTask)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-stretch sm:self-auto active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Session</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CURATED RECOMMENDATIONS FROM SYLLABUS */}
            {recommendedPlanTasks.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#F2F2F7]/70 border border-[rgba(60,60,67,0.08)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF9500]" />
                    <span className="text-xs font-bold text-[#1D1D1F]">
                      Recommended from Your Syllabus Weak Spots
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePopulateFromPlan}
                    className="text-[11px] font-semibold text-[#007AFF] hover:underline cursor-pointer"
                  >
                    Add All
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recommendedPlanTasks.map((rec) => {
                    const sub = FMGE_SUBJECTS.find((s) => s.id === rec.subjectId);
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleAddSinglePlanTask(rec)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-[#E5E5EA] border border-[rgba(60,60,67,0.10)] text-xs text-[#1D1D1F] font-medium shadow-2xs transition-all cursor-pointer active:scale-95 group text-left"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sub?.color || '#007AFF' }}
                        />
                        <span className="truncate max-w-[200px]">{rec.topicName}</span>
                        <Plus className="w-3 h-3 text-[#007AFF] shrink-0 group-hover:rotate-90 transition-transform" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Task Filter Segmented Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="inline-flex p-1 bg-[#F2F2F7] rounded-full border border-[rgba(60,60,67,0.08)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTaskFilter('all')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    taskFilter === 'all'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  All ({totalTaskCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('pending')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    taskFilter === 'pending'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  Pending ({pendingTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('completed')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    taskFilter === 'completed'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  Completed ({completedTasks.length})
                </button>
              </div>

              {totalTaskCount === 0 && (
                <button
                  type="button"
                  onClick={handlePopulateFromPlan}
                  className="text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer"
                >
                  Auto-Populate Today's Plan
                </button>
              )}
            </div>

            {/* Task List Items */}
            {filteredTasks.length > 0 ? (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => {
                  const sub = FMGE_SUBJECTS.find((s) => s.id === task.subjectId);
                  const isCompleted = task.completed;
                  const isActive = activeTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group ${
                        isActive
                          ? 'border-[#007AFF] bg-[#007AFF]/[0.03] ring-1 ring-[#007AFF]/20 shadow-2xs'
                          : isCompleted
                          ? 'border-[rgba(60,60,67,0.08)] bg-[#F2F2F7]/50'
                          : 'border-[rgba(60,60,67,0.10)] bg-white hover:border-[#007AFF]/40 hover:shadow-xs'
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
                              ? 'bg-[#30D158] text-white shadow-2xs'
                              : 'border-2 border-[#C7C7CC] hover:border-[#007AFF] bg-white'
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
                              className={`text-xs sm:text-sm font-semibold leading-snug truncate ${
                                isCompleted ? 'line-through text-[#8E8E93]' : 'text-[#1D1D1F]'
                              }`}
                            >
                              {task.title}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                                Active Focus
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8E8E93] font-medium flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[#1D1D1F] font-semibold">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: sub?.color || '#007AFF' }}
                              />
                              {sub?.name || 'General Medicine'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{task.type.replace('_', ' ')}</span>
                            {task.priority === 'high' && (
                              <>
                                <span>•</span>
                                <span className="text-[#FF3B30] font-semibold">High Priority</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Duration & Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-[#6E6E73] font-mono font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#8E8E93]" />
                          <span>{task.durationMinutes}m</span>
                        </div>

                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTaskId(task.id);
                              handleModeChange('pomodoro', (task.durationMinutes || 25) * 60);
                              setIsRunning(true);
                              setMobileTab('focus');
                            }}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#007AFF]/10 hover:bg-[#007AFF] text-[#007AFF] hover:text-white transition-all cursor-pointer active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Focus</span>
                          </button>
                        )}

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          className="text-[#C7C7CC] hover:text-[#FF3B30] p-1 rounded-lg hover:bg-[#FF3B30]/10 transition-colors opacity-60 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
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
              <div className="text-center py-10 bg-[#F2F2F7]/60 rounded-2xl border border-dashed border-[rgba(60,60,67,0.15)] space-y-3 px-4">
                <BookmarkCheck className="w-8 h-8 text-[#8E8E93] mx-auto" />
                <p className="text-xs text-[#6E6E73] font-medium max-w-sm mx-auto">
                  {taskFilter === 'completed'
                    ? 'No completed tasks yet. Check off your first study milestone today!'
                    : taskFilter === 'pending' && totalTaskCount > 0
                    ? 'All tasks completed for today! Awesome dedication doctor.'
                    : 'No study tasks planned for today yet. Load high-yield topics directly from your personalized syllabus plan.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePopulateFromPlan}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>Load Today’s Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTask(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#E5E5EA] border border-[rgba(60,60,67,0.12)] text-[#1D1D1F] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Custom Task</span>
                  </button>
                </div>
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
          <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-7 border border-[rgba(60,60,67,0.10)] shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            {/* Luminous Top Shimmer Track */}
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#007AFF]/25 to-transparent" />
              <motion.div
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
                className="w-36 sm:w-56 h-full bg-gradient-to-r from-transparent via-[#007AFF] to-transparent shadow-[0_0_12px_rgba(0,122,255,0.4)]"
              />
            </div>

            {/* Card Header with Rotating Gyroscope & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="relative p-2.5 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] shrink-0 mt-0.5 border border-[#007AFF]/15 shadow-2xs">
                  <motion.div
                    animate={{ rotate: isRunning ? 360 : 0 }}
                    transition={isRunning ? { duration: 12, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
                    className="absolute inset-0 rounded-2xl border border-dashed border-[#007AFF]/40 pointer-events-none"
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
                    <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] leading-snug">
                      Focus Studio
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border transition-colors ${
                        isRunning
                          ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                          : 'bg-[#F2F2F7] text-[#6E6E73] border-[rgba(60,60,67,0.10)]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isRunning ? 'bg-[#30D158] animate-pulse' : 'bg-[#8E8E93]'
                        }`}
                      />
                      {isRunning
                        ? timerMode === 'pomodoro'
                          ? 'Deep Flow'
                          : timerMode === 'stopwatch'
                          ? 'Stopwatch'
                          : 'Break'
                        : 'Standby'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] mt-0.5 leading-relaxed font-medium">
                    Deep work. High retention. Real progress.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenZenFocus && (
                  <button
                    type="button"
                    onClick={onOpenZenFocus}
                    className="px-3 py-1.5 rounded-full border border-[rgba(60,60,67,0.10)] bg-white hover:bg-[#F2F2F7] text-[#007AFF] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group active:scale-95"
                    title="Enter Fullscreen Zen Study Sanctuary"
                  >
                    <Headphones className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-semibold hidden sm:inline">Zen Sanctuary</span>
                  </button>
                )}
              </div>
            </div>

            {/* Circular Timer Display */}
            <div className="flex flex-col items-center justify-center py-1">
              <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  {/* Background Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    className="stroke-[#E5E5EA]"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Active Progress Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    className={`${
                      timerMode.includes('break') ? 'stroke-[#30D158]' : 'stroke-[#007AFF]'
                    } transition-all duration-300 ease-linear`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Inside Circle Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${
                    timerMode.includes('break') ? 'text-[#30D158]' : 'text-[#007AFF]'
                  }`}>
                    {timerMode === 'pomodoro'
                      ? 'FOCUS'
                      : timerMode === 'short_break'
                      ? 'SHORT BREAK'
                      : timerMode === 'long_break'
                      ? 'LONG BREAK'
                      : 'STOPWATCH'}
                  </span>

                  <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-[#1D1D1F]">
                    {formatTime(timeLeft)}
                  </div>

                  <span className="text-xs text-[#8E8E93] font-medium">
                    {isRunning ? 'Session in progress' : timeLeft === 0 ? 'Session Complete' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Presets Segment Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#8E8E93]">
                <span>Session Preset</span>
                <span>{timerMode === 'pomodoro' ? `${Math.round(totalDuration / 60)} min` : timerMode.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { mode: 'pomodoro', minutes: 25, label: '25m Focus' },
                  { mode: 'pomodoro', minutes: 45, label: '45m Study' },
                  { mode: 'short_break', minutes: 5, label: '5m Break' },
                  { mode: 'long_break', minutes: 15, label: '15m Break' },
                ].map((preset) => {
                  const isCurrent =
                    timerMode === preset.mode &&
                    (preset.mode !== 'pomodoro' || totalDuration === preset.minutes * 60);

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleModeChange(preset.mode as any, preset.minutes * 60)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                        isCurrent
                          ? 'bg-[#1D1D1F] text-white shadow-xs'
                          : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#6E6E73] hover:text-[#1D1D1F] border border-[rgba(60,60,67,0.06)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ambient Sound Synthesizer Dock */}
            <div className="p-3.5 rounded-2xl bg-[#F2F2F7]/70 border border-[rgba(60,60,67,0.08)] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-[#1D1D1F]">
                  {soundMode === 'off' ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#8E8E93]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#007AFF]" />
                  )}
                  <span>Ambient Focus Audio</span>
                </div>
                <span className="font-mono text-[10px] text-[#8E8E93]">Web Audio API</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
                {[
                  { id: 'off', label: 'Mute' },
                  { id: 'alpha', label: 'Alpha 10Hz' },
                  { id: 'rain', label: 'Rain' },
                  { id: 'whitenoise', label: 'White Noise' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSoundToggle(s.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      soundMode === s.id
                        ? 'bg-[#007AFF] text-white shadow-xs'
                        : 'bg-white text-[#1D1D1F] border border-[rgba(60,60,67,0.10)] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Study Task Banner with Direct Practice MCQ Action */}
            {activeFocusTask && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F2F2F7] to-white border border-[rgba(60,60,67,0.10)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/15 flex items-center justify-center shrink-0 shadow-2xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] truncate">
                      {activeFocusTask.title}
                    </h4>
                    <p className="text-[11px] text-[#8E8E93] truncate">
                      {(() => {
                        const sub = FMGE_SUBJECTS.find((s) => s.id === activeFocusTask.subjectId);
                        return `${sub?.name || 'General Medicine'} • Active Focus Topic`;
                      })()}
                    </p>
                  </div>
                </div>

                {onLaunchPracticeSession && activeFocusTask.subjectId && (
                  <button
                    type="button"
                    onClick={() => {
                      const topicId = (activeFocusTask as any).topicId || `${activeFocusTask.subjectId}-1`;
                      onLaunchPracticeSession(activeFocusTask.subjectId, topicId, activeFocusTask.title);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F2F2F7] border border-[rgba(60,60,67,0.12)] text-[#007AFF] text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    Practice MCQs →
                  </button>
                )}
              </div>
            )}

            {/* Timer Control Primary Action Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 py-3 px-5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95 ${
                  isRunning
                    ? 'bg-[#FF9500] hover:bg-[#E08500] text-white shadow-[0_4px_16px_rgba(255,149,0,0.25)]'
                    : 'bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)]'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    <span>Start Focus Session</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleStopTimer}
                className="py-3 px-4 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-[rgba(60,60,67,0.10)] text-[#FF3B30] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                title="Stop and Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Focus Tip Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/40 border border-[#F59E0B]/20 space-y-1">
              <div className="flex items-center gap-2 text-[#92400E] font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[#B45309]">
                  <Lightbulb className="w-3 h-3" />
                </div>
                <span>Focus Tip</span>
              </div>
              <p className="text-xs text-[#92400E]/90 leading-relaxed pl-7 font-medium">
                {focusTips[currentTipIndex]}
              </p>
            </div>

            {/* Today's Progress Section: 4 Apple Bento Metric Tiles */}
            <div className="space-y-3 pt-2 border-t border-[rgba(60,60,67,0.08)]">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F]">Today’s Telemetry</h3>
                <p className="text-xs text-[#8E8E93]">Consistent daily blocks compound into 200+ marks.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Tasks completed (Emerald) */}
                <div className="p-3.5 rounded-2xl bg-[#30D158]/[0.08] border border-[#30D158]/20 space-y-1.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-white/80 text-[#30D158] flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="font-mono text-base font-bold text-[#1D1D1F] leading-tight">
                    {completedTaskCount}/{totalTaskCount}
                  </div>
                  <div className="text-[10.5px] text-[#1A7A35] font-semibold">Tasks done</div>
                </div>

                {/* 2. Study time (Blue) */}
                <div className="p-3.5 rounded-2xl bg-[#007AFF]/[0.08] border border-[#007AFF]/20 space-y-1.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-white/80 text-[#007AFF] flex items-center justify-center shadow-xs">
                    <Clock className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="font-mono text-base font-bold text-[#1D1D1F] leading-tight">
                    {studyTimeFormatted}
                  </div>
                  <div className="text-[10.5px] text-[#007AFF] font-semibold">Study time</div>
                </div>

                {/* 3. Subjects covered (Indigo) */}
                <div className="p-3.5 rounded-2xl bg-[#5856D6]/[0.08] border border-[#5856D6]/20 space-y-1.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-white/80 text-[#5856D6] flex items-center justify-center shadow-xs">
                    <BookOpen className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="font-mono text-base font-bold text-[#1D1D1F] leading-tight">
                    {uniqueSubjectsCount}
                  </div>
                  <div className="text-[10.5px] text-[#5856D6] font-semibold">Subjects</div>
                </div>

                {/* 4. Daily goal (Amber) */}
                <div className="p-3.5 rounded-2xl bg-[#FF9500]/[0.08] border border-[#FF9500]/20 space-y-1.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-white/80 text-[#FF9500] flex items-center justify-center shadow-xs">
                    <Target className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="font-mono text-base font-bold text-[#1D1D1F] leading-tight">
                    {dailyGoalPercent}%
                  </div>
                  <div className="text-[10.5px] text-[#FF9500] font-semibold">Daily goal</div>
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
          <div className="px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-2xl border border-[rgba(60,60,67,0.12)] shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 font-sans text-[#1D1D1F]">
            {/* Left: Tappable to open the full Focus Engine */}
            <button
              type="button"
              onClick={() => setMobileTab('focus')}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group active:scale-95 transition-transform"
              title="Open full Focus Engine"
            >
              <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/15 flex items-center justify-center shrink-0 group-hover:bg-[#007AFF]/20 transition-colors">
                <Clock className="w-4 h-4 text-[#007AFF]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#1D1D1F] leading-tight">
                    Focus Engine
                  </span>
                  {isRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse shrink-0" />
                  )}
                </div>
                <div className="font-mono text-sm font-bold text-[#1D1D1F] leading-tight">
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
                className="w-10 h-10 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-all"
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
                className="w-9 h-9 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#FF3B30] flex items-center justify-center shadow-2xs border border-[rgba(60,60,67,0.10)] cursor-pointer active:scale-90 transition-all"
                title="Stop and Reset Session"
                aria-label="Stop Session"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {showAddTask &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[rgba(60,60,67,0.10)] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1D1D1F]">Add Today’s Study Task</h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5 font-medium">Plan a high-yield study or MCQ block.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="p-1.5 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1D1D1F] mb-1 text-[11px]">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solve 50 MCQs of Cardiology ECGs"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F2F2F7] border border-[rgba(60,60,67,0.12)] rounded-xl text-xs text-[#1D1D1F] focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/12 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1 text-[11px]">Subject</label>
                    <select
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                      className="w-full h-10 px-2.5 bg-[#F2F2F7] border border-[rgba(60,60,67,0.12)] rounded-xl text-xs font-medium text-[#1D1D1F] focus:bg-white focus:border-[#007AFF] focus:outline-none cursor-pointer transition-all"
                    >
                      {FMGE_SUBJECTS.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} (~{sub.weightage}M)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1 text-[11px]">Task Type</label>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="w-full h-10 px-2.5 bg-[#F2F2F7] border border-[rgba(60,60,67,0.12)] rounded-xl text-xs font-medium text-[#1D1D1F] focus:bg-white focus:border-[#007AFF] focus:outline-none cursor-pointer transition-all"
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
                    <label className="block font-semibold text-[#1D1D1F] mb-1 text-[11px]">Duration (Minutes)</label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-[#F2F2F7] border border-[rgba(60,60,67,0.12)] rounded-xl text-xs font-bold font-mono text-[#1D1D1F] focus:bg-white focus:border-[#007AFF] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1D1D1F] mb-1 text-[11px]">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full h-10 px-2.5 bg-[#F2F2F7] border border-[rgba(60,60,67,0.12)] rounded-xl text-xs font-medium text-[#1D1D1F] focus:bg-white focus:border-[#007AFF] focus:outline-none cursor-pointer transition-all"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[rgba(60,60,67,0.08)]">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="px-4 py-2 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1D1D1F] rounded-full font-semibold cursor-pointer active:scale-95 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-full font-semibold shadow-xs cursor-pointer transition-colors active:scale-95"
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
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[rgba(60,60,67,0.10)] space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#007AFF]">
                    STUDY CONSISTENCY CALENDAR
                  </span>
                  <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight mt-0.5">
                    Daily Study Habit Tracker
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="p-1.5 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Streak Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF7ED] to-white border border-orange-200/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF9500] flex items-center justify-center shadow-xs">
                    <Flame className="w-6 h-6 fill-[#FF9500] text-[#FF9500]" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#1D1D1F]">
                      {streakDays} Day Study Streak
                    </div>
                    <div className="text-xs text-[#8E8E93]">
                      {streakDays >= 3 ? 'Excellent momentum! Keep it going.' : 'Log at least 30m every day.'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white text-[#FF9500] border border-orange-200 shadow-2xs">
                  {streakDays > 0 ? 'ACTIVE' : 'START TODAY'}
                </span>
              </div>

              {/* Today's Stats Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-[rgba(60,60,67,0.08)] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#8E8E93] font-bold block">
                    Today's Study Hours
                  </span>
                  <div className="font-mono text-lg font-bold text-[#1D1D1F]">
                    {(todayLog.studyMinutes / 60).toFixed(1)} / {state.settings.dailyStudyHourGoal}h
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F2F2F7] border border-[rgba(60,60,67,0.08)] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#8E8E93] font-bold block">
                    MCQs Solved Today
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={todayLog.questionsSolved}
                      onChange={(e) =>
                        onUpdateDailyLog(todayStr, { questionsSolved: Number(e.target.value) })
                      }
                      className="w-20 font-mono text-lg font-bold text-[#1D1D1F] bg-white border border-[rgba(60,60,67,0.15)] rounded-lg px-2 py-0.5 focus:border-[#007AFF] focus:outline-none"
                    />
                    <span className="text-[#8E8E93] font-mono text-xs">Qs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-6 py-2.5 bg-[#1D1D1F] hover:bg-black text-white rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
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
