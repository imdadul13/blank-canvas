import React, { useState, useEffect, useRef, useMemo } from 'react';
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
      className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in duration-150 pb-44 lg:pb-16 text-slate-900"
      style={{
        paddingBottom: 'calc(max(1rem, env(safe-area-inset-bottom, 1rem)) + 145px)',
      }}
    >
      {/* 1. Header & Greeting Area */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-semibold text-stone-500 tracking-wide">
            {greeting}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-semibold text-slate-900 tracking-tight leading-tight">
            Today’s Plan Brings You Closer.
          </h1>
          <p className="text-sm sm:text-base text-stone-500 leading-relaxed font-normal">
            Focus. Learn. Revise. Improve. One step at a time.
          </p>
        </div>

        {/* Top Right Controls & Editorial Quote Card */}
        <div className="flex flex-col items-start lg:items-end gap-3 self-stretch lg:self-auto">
          {/* Top Pill Row: Date, Bell, User Avatar */}
          <div className="flex items-center gap-2.5 self-start lg:self-end">
            {/* Date Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#00685f]" />
              <span>{formattedDate}</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-full bg-white border border-stone-200/80 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* User Avatar Circle */}
            <div
              className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs font-mono select-none"
              title={state.settings.userName || 'Dr. Aspirant'}
            >
              {state.settings.userName
                ? state.settings.userName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'DA'}
            </div>
          </div>

          {/* Editorial Quote Card (matching reference) */}
          <div className="bg-[#ECF7F5] border border-[#CBEBE5] rounded-2xl p-4 flex items-start gap-3 max-w-sm w-full shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-[#D4F0EB] text-[#00685f] flex items-center justify-center shrink-0 font-serif text-lg font-bold select-none">
              “
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-800 font-medium leading-snug">
                “Discipline today builds the doctor you’ll be tomorrow.”
              </p>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00685f] block">
                — ONE SHOT FMGE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Header Mode Switcher & View Calendar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('planner')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
        <button
          type="button"
          onClick={() => setShowCalendarModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200/80 hover:border-stone-300 text-stone-700 hover:text-stone-900 text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-[#00685f]" />
          <span>View Calendar</span>
        </button>
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
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-6">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ECF7F5] text-[#00685f] shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    Focus Engine
                  </h2>
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
                    ? 'bg-stone-100 border-stone-300 text-stone-900'
                    : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
                title="Timer Settings & Ambient Sound"
              >
                <Settings className="w-3.5 h-3.5" />
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
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4">
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
        </div>
      )}

      {/* MODAL: VIEW CALENDAR & STREAK */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5">
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
        </div>
      )}
    </div>
  );
};
