import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MENTOR_HUES, type MentorHueKey } from './mentorPalette';
import { motion, useReducedMotion } from 'motion/react';
import { ICON_HOVER, SPRING_SNAPPY } from '@/utils/motionTokens';
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
  Mic,
  MicOff,
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
  onSetInputQuery?: (query: string) => void;
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
  onSetInputQuery,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const reduced = useReducedMotion();

  /* SwiftUI-style press response. Every control in the dock used to hand-roll
     `scale: 0.96` with no transition, so presses snapped linearly and never
     settled; the component also never read `useReducedMotion`, so the entire
     dock animated for users who asked it not to. */
  const chipPress = reduced
    ? {}
    : {
        whileHover: { scale: 1.03, y: -1, transition: SPRING_SNAPPY },
        whileTap: { scale: 0.96, transition: SPRING_SNAPPY },
      };
  const toolPress = reduced ? {} : ICON_HOVER(false);

  const toggleVoiceDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          const newQuery = inputQuery ? `${inputQuery.trim()} ${transcript}` : transcript;
          if (onSetInputQuery) {
            onSetInputQuery(newQuery);
          } else {
            const synthEvent = {
              target: { value: newQuery },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onInputChange(synthEvent);
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };
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

  /* Both icon and hue key off the label rather than the array index, so a rail
     that reorders or drops an item keeps every remaining chip on its own
     colour instead of shifting the whole palette. */
  const getActionHue = (label: string, idx: number): MentorHueKey => {
    const l = label.toLowerCase();
    if (l.includes('concept') || idx === 0) return 'blue';
    if (l.includes('compare') || l.includes('differ') || idx === 1) return 'purple';
    if (l.includes('mcq') || l.includes('vignette') || idx === 2) return 'orange';
    return 'green';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file && fileInputRef.current) {
          try {
            e.preventDefault();
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            const evt = new Event('change', { bubbles: true });
            fileInputRef.current.dispatchEvent(evt);
          } catch (_) {}
          break;
        }
      }
    }
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
          className="flex w-fit max-w-full items-center gap-3 rounded-2xl border border-[rgba(60,60,67,0.12)] bg-white p-2 shadow-sm"
        >
          <div
            className="group relative size-11 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-[rgba(60,60,67,0.1)] bg-black"
            onClick={() => onOpenImageModal(attachedImage.previewUrl, attachedImage.fileName)}
            title="Click to zoom image"
          >
            <img
              src={attachedImage.previewUrl}
              alt="Attached clinical investigation"
              className="size-full object-cover transition-transform group-hover:scale-110"
            />
          </div>
          <div className="min-w-0 pr-1">
            <p className="text-[13px] max-w-[180px] truncate font-semibold text-[#1D1D1F] sm:max-w-xs">
              {attachedImage.fileName}
            </p>
            <p className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#007AFF]">Clinical investigation attached</p>
          </div>
          <button
            type="button"
            onClick={onRemoveImage}
            className="shrink-0 cursor-pointer rounded-full p-1.5 text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] transition-colors"
            title="Remove image"
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </button>
        </motion.div>
      )}

      {/* Quick Action Suggestion Chips (Docked above input with Apple HIG Frosted Capsules) */}
      <div className="no-scrollbar flex touch-pan-x items-center gap-1.5 overflow-x-auto pb-1">
        {/* Faculty Viva Quick Action Chip */}
        <motion.button
          type="button"
          {...chipPress}
          onClick={() =>
            onSendMessage(
              'Conduct a high-yield FMGE bedside Viva with me. Present a 35yo patient presenting in the emergency room with acute symptoms. Give me ONLY the initial scenario and ask for my immediate first step. Wait for my answer, then critique and proceed to stage 2.'
            )
          }
          disabled={isLoading}
          className="group flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-300/80 bg-amber-50 px-3.5 py-1.5 text-[11.5px] font-bold text-amber-900 shadow-xs transition-all hover:bg-amber-100 active:scale-[0.97] disabled:opacity-50"
        >
          <Stethoscope className="size-3.5 text-amber-700 transition-transform group-hover:scale-110" />
          <span>Start faculty viva</span>
        </motion.button>

        {quickActions.map((action, idx) => {
          const Icon = getActionIcon(action.label, idx);
          const hue = MENTOR_HUES[getActionHue(action.label, idx)];
          return (
            <motion.button
              key={idx}
              type="button"
              {...chipPress}
              onClick={() => onSendMessage(action.query)}
              disabled={isLoading}
              className="group flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(60,60,67,0.1)] bg-[#F2F2F7] hover:bg-[#E5E5EA] px-3.5 py-1.5 text-[11.5px] font-semibold text-[#1D1D1F] shadow-xs transition-all active:scale-[0.97] disabled:opacity-50"
            >
              <span
                className="grid size-4 place-items-center rounded-full"
                style={{ background: hue.tint }}
              >
                <Icon className="size-2.5 transition-transform group-hover:scale-110" style={{ color: hue.bar }} />
              </span>
              <span>{action.label}</span>
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          {...chipPress}
          onClick={() => onSendMessage('Give me 5 high-yield clinical MCQs across different FMGE subjects with distractor analysis.')}
          disabled={isLoading}
          className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-[rgba(60,60,67,0.1)] bg-[#F2F2F7] hover:bg-[#E5E5EA] px-3 py-1.5 text-[11.5px] font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-all active:scale-[0.97]"
          title="More suggestions"
        >
          <MoreHorizontal className="size-3.5" />
          <span>More</span>
        </motion.button>
      </div>

      {/* Main Clinical Prompt & Inquiry Bar (Apple Executive Floating Dock) */}
      <div
        className={cn(
          'relative rounded-2xl sm:rounded-3xl border bg-white p-2 sm:p-2.5 transition-all duration-200',
          'shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.02)]',
          isHighlighted
            ? 'border-[#007AFF] ring-4 ring-[#007AFF]/15'
            : 'border-[rgba(60,60,67,0.12)] focus-within:border-[#007AFF] focus-within:ring-4 focus-within:ring-[#007AFF]/12',
        )}
      >

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
            {...toolPress}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border transition-colors',
              attachedImage
                ? 'border-[#007AFF]/40 bg-[#007AFF]/10 text-[#007AFF]'
                : 'border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]',
            )}
            title="Attach medical image (ECG, X-ray, slide, histopathology, clinical photo)"
            aria-label="Attach medical image"
          >
            <ImageIcon className="size-4" />
          </motion.button>

          {/* Hands-Free Voice Dictation Button */}
          <motion.button
            type="button"
            {...toolPress}
            onClick={toggleVoiceDictation}
            className={cn(
              'grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border transition-colors',
              isListening
                ? 'animate-pulse border-transparent bg-rose-500 text-white'
                : 'border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] text-[#6E6E73] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]',
            )}
            title={isListening ? 'Stop listening' : 'Dictate question (Speech-to-Text)'}
            aria-label="Dictate question (Speech-to-Text)"
          >
            {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </motion.button>

          {/* Auto-resizing Question Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuery}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachedImage
                ? 'Ask about this attached investigation…'
                : isNarrowScreen
                ? 'Ask your faculty mentor…'
                : 'Ask anything — e.g. nephrotic vs nephritic, ECG in hyperkalaemia, DOC for status epilepticus'
            }
            className="min-h-[38px] max-h-[140px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-relaxed text-[#1D1D1F] placeholder:text-[#8E8E93] focus:outline-none focus:ring-0 sm:py-2"
          />

          {/* Compact Send Button (Desktop/Mobile) */}
          <motion.button
            type="button"
            {...(hasContent && !isLoading ? toolPress : {})}
            onClick={() => onSendMessage()}
            disabled={!hasContent || isLoading}
            aria-label="Send clinical inquiry"
            className={cn(
              'flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all',
              hasContent && !isLoading
                ? 'bg-[#007AFF] hover:bg-[#0066D6] text-white shadow-[0_4px_14px_rgba(0,122,255,0.3)]'
                : 'cursor-not-allowed border border-[rgba(60,60,67,0.1)] bg-[#F2F2F7] text-[#C7C7CC]',
            )}
          >
            {isLoading ? (
              <RefreshCw className="size-3.5 animate-spin text-[#007AFF]" />
            ) : (
              <>
                <span className="hidden xs:inline">Ask</span>
                <ArrowUp className="size-3.5 stroke-[2.5]" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
