import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ImageIcon,
  Send,
  RefreshCw,
  X,
  MoreHorizontal,
  Activity,
  Brain,
  Stethoscope,
  Award,
  ArrowUp,
  ShieldCheck,
} from 'lucide-react';

interface QuickAction {
  label: string;
  query: string;
}

interface AttachedImageInfo {
  previewUrl: string;
  fileName: string;
}

interface MentorPromptDeskProps {
  inputQuery: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (query?: string) => void;
  isLoading: boolean;
  attachedImage: AttachedImageInfo | null;
  onRemoveImage: () => void;
  onOpenImageModal: (url: string, title: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  quickActions: QuickAction[];
  isHighlighted?: boolean;
}

export const MentorPromptDesk: React.FC<MentorPromptDeskProps> = ({
  inputQuery,
  onInputChange,
  onKeyDown,
  onSendMessage,
  isLoading,
  attachedImage,
  onRemoveImage,
  onOpenImageModal,
  fileInputRef,
  textareaRef,
  onImageSelect,
  quickActions,
  isHighlighted = false,
}) => {
  const [isNarrowScreen, setIsNarrowScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getActionIcon = (label: string, idx: number) => {
    const l = label.toLowerCase();
    if (l.includes('concept') || idx === 0) return Brain;
    if (l.includes('compare') || l.includes('differ') || idx === 1) return Stethoscope;
    if (l.includes('mcq') || l.includes('vignette') || idx === 2) return Award;
    return Activity;
  };

  const hasContent = Boolean(inputQuery.trim() || attachedImage);

  return (
    <div className="space-y-2">
      {/* Attached Image Preview Badge */}
      {attachedImage && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center gap-3 p-2 bg-teal-50/90 border border-teal-200/90 rounded-2xl w-fit max-w-full shadow-2xs backdrop-blur-md"
        >
          <div
            className="relative h-11 w-11 rounded-xl overflow-hidden border border-teal-300 bg-slate-900 cursor-zoom-in group shrink-0 shadow-2xs"
            onClick={() => onOpenImageModal(attachedImage.previewUrl, attachedImage.fileName)}
            title="Click to zoom image"
          >
            <img
              src={attachedImage.previewUrl}
              alt="Attached clinical investigation"
              className="h-full w-full object-cover group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="min-w-0 pr-1">
            <p className="text-xs font-bold text-teal-950 truncate max-w-[180px] sm:max-w-xs font-['Outfit']">
              {attachedImage.fileName}
            </p>
            <p className="text-[10px] text-teal-700 font-sans">
              Clinical Investigation Attached
            </p>
          </div>
          <button
            type="button"
            onClick={onRemoveImage}
            className="p-1.5 hover:bg-teal-200/80 rounded-full text-teal-800 transition-colors cursor-pointer shrink-0"
            title="Remove image"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {/* Quick Action Suggestion Chips (Docked above input with refined clinical pill styling) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs touch-pan-x">
        {quickActions.map((action, idx) => {
          const Icon = getActionIcon(action.label, idx);
          return (
            <motion.button
              key={idx}
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSendMessage(action.query)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1.5 bg-white/90 hover:bg-teal-50/90 border border-slate-200/80 hover:border-teal-300 rounded-full text-[11px] font-semibold text-slate-700 hover:text-[#006B63] transition-all cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50 shrink-0 flex items-center gap-1.5 group backdrop-blur-xs"
            >
              <Icon className="h-3.5 w-3.5 text-[#006B63] group-hover:scale-110 transition-transform" />
              <span className="font-['Outfit']">{action.label}</span>
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSendMessage('Give me 5 high-yield clinical MCQs across different FMGE subjects with distractor analysis.')}
          disabled={isLoading}
          className="whitespace-nowrap px-2.5 py-1.5 bg-white/90 hover:bg-teal-50/90 border border-slate-200/80 hover:border-teal-300 rounded-full text-[11px] font-semibold text-slate-500 hover:text-[#006B63] transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
          title="More suggestions"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
          <span className="font-['Outfit']">More</span>
        </motion.button>
      </div>

      {/* Main Clinical Prompt & Inquiry Bar (Refined Executive Dock) */}
      <div
        className={`relative rounded-3xl border transition-all duration-300 ${
          isHighlighted
            ? 'border-[#006B63] ring-4 ring-teal-500/25 shadow-[0_0_30px_rgba(0,107,99,0.22)] bg-white'
            : 'border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] focus-within:border-[#006B63] focus-within:ring-3 focus-within:ring-teal-500/15 focus-within:shadow-[0_8px_30px_rgba(0,107,99,0.1)]'
        } p-2 sm:p-2.5`}
      >
        {/* Top luminous accent shimmer line */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

        {/* Textarea Input Row */}
        <div className="flex items-center gap-2">
          {/* Hidden File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={onImageSelect}
          />

          {/* Medical Asset Attachment Tool Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-2xl transition-all shrink-0 cursor-pointer ${
              attachedImage
                ? 'bg-teal-100 text-[#006B63] hover:bg-teal-200 shadow-2xs'
                : 'bg-slate-50 hover:bg-teal-50/80 text-slate-400 hover:text-[#006B63] border border-slate-200/70 hover:border-teal-200'
            }`}
            title="Attach Medical Image (ECG, X-Ray, Slide, Histopathology, Clinical Photo)"
            aria-label="Attach medical image"
          >
            <ImageIcon className="h-4 w-4" />
          </motion.button>

          {/* Auto-resizing Question Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuery}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder={
              attachedImage
                ? 'Ask about this attached investigation...'
                : isNarrowScreen
                ? 'Ask your Faculty Mentor...'
                : 'Ask your Faculty Mentor anything (e.g., Nephrotic vs Nephritic, ECG in Hyperkalemia, DOC for status epilepticus)...'
            }
            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 resize-none py-1.5 sm:py-2 px-1 min-h-[38px] max-h-[140px] leading-relaxed font-sans"
          />

          {/* Compact Send Button (Desktop/Mobile) */}
          <motion.button
            type="button"
            whileHover={!hasContent || isLoading ? undefined : { scale: 1.04 }}
            whileTap={!hasContent || isLoading ? undefined : { scale: 0.94 }}
            onClick={() => onSendMessage()}
            disabled={!hasContent || isLoading}
            aria-label="Send clinical inquiry"
            className={`flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4.5 rounded-2xl text-xs font-bold font-['Outfit'] transition-all shrink-0 cursor-pointer ${
              hasContent && !isLoading
                ? 'bg-gradient-to-r from-[#006B63] via-[#00746b] to-[#008f84] hover:from-[#00544e] hover:to-[#00746b] text-white shadow-xs hover:shadow-md'
                : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#006B63]" />
            ) : (
              <>
                <span className="hidden xs:inline">Ask</span>
                <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
