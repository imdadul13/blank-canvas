import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ChevronRight, History } from 'lucide-react';

interface MentorActiveBarProps {
  title?: string;
  onOpenHistory: () => void;
}

export const MentorActiveBar: React.FC<MentorActiveBarProps> = ({
  title,
  onOpenHistory,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-center justify-between gap-2.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs backdrop-blur-md hover:border-teal-300/70 transition-colors"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#006B63] shrink-0 shadow-2xs">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              ACTIVE CONSULTATION
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit'] truncate max-w-[200px] sm:max-w-md md:max-w-lg">
            {title || 'Current Consultation'}
          </h3>
        </div>
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onOpenHistory}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#006B63] bg-white hover:bg-slate-50 border border-slate-200/90 px-3 sm:px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
        title="View consultation history"
      >
        <History className="h-3.5 w-3.5 text-[#006B63]" />
        <span className="hidden sm:inline">View History</span>
        <span className="sm:hidden text-[11px]">History</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
      </motion.button>
    </motion.div>
  );
};
