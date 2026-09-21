import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Share2,
  Copy,
  Check,
  Flame,
  Target,
  Calendar,
  Sparkles,
  MessageCircle,
  Send,
  Award,
} from 'lucide-react';
import { AppState } from '../types';
import { AppStats } from '../utils/storage';
import { getDaysRemainingToExam } from '../utils/adaptivePriorityEngine';
import { calculateStudyStreak } from '../utils/dailyMissionEngine';

interface ShareMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  stats?: AppStats;
}

export const ShareMilestoneModal: React.FC<ShareMilestoneModalProps> = ({
  isOpen,
  onClose,
  state,
  stats,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const daysRemaining = getDaysRemainingToExam(state);
  const targetScore = state.settings?.targetScore || 200;
  const userName = state.settings?.userName || 'Dr. Aspirant';
  const solvedToday = stats?.todayQuestionsSolved || 0;
  const streak = Math.max(1, calculateStudyStreak(state.studyLogs));
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://oneshot-fmge-web.onrender.com';

  const shareText = `🩺 ${userName}'s FMGE Study Milestone:
🔥 ${streak}-Day Continuous Study Streak
🎯 Target Score: ${targetScore}+ / 300
⏳ ${daysRemaining} Days to NBE FMGE Exam
⚡ Questions Mastered Today: ${solvedToday}

Practicing high-yield clinical vignettes on One Shot FMGE:
${appUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My FMGE Study Milestone',
          text: shareText,
          url: appUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="bg-gradient-to-br from-[#006B63] to-[#0D3833] text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-400/20 text-teal-200 border border-teal-300/30">
                <Sparkles className="w-3 h-3 text-teal-300" />
                Study Milestone
              </span>
            </div>

            <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans']">
              Share Your Progress
            </h2>
            <p className="text-xs text-teal-100/80 mt-1">
              Inspire peers in your WhatsApp & Telegram medical study groups.
            </p>
          </div>

          {/* Milestone Preview Card */}
          <div className="p-6 space-y-5">
            <div className="rounded-2xl bg-[#F0FAF7] border border-[#CDEAE3] p-4.5 space-y-3 font-mono text-xs text-slate-800 relative">
              <div className="flex items-center justify-between pb-2 border-b border-[#CDEAE3]/70 font-sans">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  🩺 {userName}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ONE SHOT FMGE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-sans pt-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-[#DCEEE9]">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Streak</span>
                    <span className="text-xs font-bold text-slate-900">{streak} Days Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-[#DCEEE9]">
                  <Calendar className="w-4 h-4 text-[#006B63] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Countdown</span>
                    <span className="text-xs font-bold text-slate-900">{daysRemaining} Days Left</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-[#DCEEE9]">
                  <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Target</span>
                    <span className="text-xs font-bold text-slate-900">{targetScore}+ / 300</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 border border-[#DCEEE9]">
                  <Award className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Today</span>
                    <span className="text-xs font-bold text-slate-900">{solvedToday} MCQs Solved</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#006B63] font-sans font-medium text-center pt-1">
                &ldquo;Consistent study today builds the doctor you&apos;ll be tomorrow.&rdquo;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer hover:shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>

              <button
                type="button"
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer hover:shadow-md"
              >
                <Send className="w-4 h-4" />
                Telegram
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Text Summary</span>
                  </>
                )}
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title="Share via device menu"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
