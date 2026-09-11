import React, { useState } from "react";
import {
  HelpCircle,
  Image as ImageIcon,
  Video as VideoIcon,
  Award,
  Lightbulb,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageSquare,
  Maximize2,
  AlertTriangle,
  Send,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { TelegramMCQ, MedicalPearl } from "../../types";

export interface UnifiedKnowledgeItem {
  id: string;
  type: "question" | "image" | "video" | "pearl" | "tip" | "notice";
  title: string;
  stem?: string;
  subject: string;
  tags?: string[];
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
  pearlTakeaway?: string;
  originalData?: any;
  isSaved?: boolean;
}

interface TelegramKnowledgeCardsProps {
  items: UnifiedKnowledgeItem[];
  savedItemIds: Set<string>;
  onToggleSave: (item: UnifiedKnowledgeItem) => void;
  onOpenImageZoom?: (url: string) => void;
  onPracticeQuestion?: (question: TelegramMCQ) => void;
  selectedAnswers?: Record<string, number>;
  onSelectOption?: (questionId: string, optionIndex: number) => void;
  onAddToErrorNotebook?: (item: any) => void;
  onSaveAsPearl?: (pearl: any) => void;
}

export const TelegramKnowledgeCards: React.FC<TelegramKnowledgeCardsProps> = ({
  items,
  savedItemIds,
  onToggleSave,
  onOpenImageZoom,
  onPracticeQuestion,
  selectedAnswers = {},
  onSelectOption,
  onAddToErrorNotebook,
  onSaveAsPearl,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "recently";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.max(1, Math.round(diffMs / 60000));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const getTypeBadge = (type: UnifiedKnowledgeItem["type"]) => {
    switch (type) {
      case "question":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80">
            <HelpCircle className="w-3 h-3" />
            Question
          </span>
        );
      case "image":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#00685f] border border-emerald-200/80">
            <ImageIcon className="w-3 h-3" />
            Image
          </span>
        );
      case "video":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80">
            <VideoIcon className="w-3 h-3" />
            Video
          </span>
        );
      case "pearl":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80">
            <Award className="w-3 h-3" />
            Exam Pearl
          </span>
        );
      case "tip":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
            <Lightbulb className="w-3 h-3" />
            Clinical Tip
          </span>
        );
      case "notice":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            Notice
          </span>
        );
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
        <p className="text-xs text-slate-500 font-medium">
          No content matches your selected filters. Try changing your subject or query.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-4.5">
      {items.map((item) => {
        const isSaved = savedItemIds.has(item.id);
        const isExpanded = !!expandedItems[item.id];
        const isQuestion = item.type === "question" || item.type === "image" || item.type === "video";
        const q: TelegramMCQ | undefined = item.originalData;
        const selectedOpt = q ? selectedAnswers[q.id] : undefined;
        const isAnswered = selectedOpt !== undefined;

        return (
          <div
            key={item.id}
            className="h-full rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-4.5 shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Card Header: Type Badge & Relative Time */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                {getTypeBadge(item.type)}
                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  {getRelativeTime(item.createdAt)}
                </span>
              </div>

              {/* Media Thumbnail if present */}
              {item.imageUrl && (
                <div className="relative mb-3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 aspect-16/10 group/img">
                  <img
                    src={item.imageUrl}
                    alt={item.title || "Clinical Image"}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  {onOpenImageZoom && (
                    <button
                      type="button"
                      onClick={() => onOpenImageZoom(item.imageUrl!)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Zoom Image
                    </button>
                  )}
                </div>
              )}

              {/* Video Thumbnail if present */}
              {item.videoUrl && (
                <div className="relative mb-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-16/10 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                    <VideoIcon className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                    Video
                  </span>
                </div>
              )}

              {/* Main Content Stem / Pearl text */}
              {item.type === "pearl" ? (
                <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100/70 mb-2.5 text-xs text-slate-800 leading-relaxed font-serif italic min-h-[52px] flex items-center">
                  “{item.pearlTakeaway || item.stem || item.title}”
                </div>
              ) : (
                <div className="text-xs font-semibold text-slate-900 line-clamp-3 leading-snug mb-2.5 min-h-[44px]">
                  {item.stem || item.title}
                </div>
              )}

              {/* Interactive MCQ options if question and expanded */}
              {q && isExpanded && q.options && q.options.length > 0 && (
                <div className="space-y-1.5 pt-1 pb-2 border-t border-stone-100 mb-2.5 animate-fadeIn">
                  {q.options.map((opt: any, idx: number) => {
                    const isSelected = selectedOpt === idx;
                    const optKey = opt?.key || String.fromCharCode(65 + idx);
                    const optText = typeof opt === "string" ? opt : opt?.text || "";
                    const correctKey = (q as any).correctKey || (q as any).correctAnswer || "";
                    const isCorrect = correctKey.toUpperCase() === optKey.toUpperCase();
                    let btnClass = "border-stone-200 bg-stone-50/80 hover:bg-stone-100 text-slate-700";

                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = "border-emerald-300 bg-emerald-50 text-emerald-900 font-bold";
                      } else if (isSelected) {
                        btnClass = "border-rose-300 bg-rose-50 text-rose-900";
                      } else {
                        btnClass = "border-stone-100 bg-white text-slate-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSelectOption && onSelectOption(q.id, idx)}
                        disabled={isAnswered}
                        className={`w-full text-left p-2 rounded-xl text-xs border transition-all cursor-pointer flex items-start gap-2 ${btnClass}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {optKey}
                        </span>
                        <span className="text-[11px] leading-tight mt-0.5">{optText}</span>
                      </button>
                    );
                  })}

                  {isAnswered && q.explanation && (
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-slate-600 leading-relaxed mt-2">
                      <span className="font-bold text-slate-900 block mb-0.5">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card Footer: Subject Tag & Bottom Action Bar */}
            <div className="pt-2 border-t border-stone-100 space-y-2 mt-auto">
              {/* Tag / Category */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 capitalize truncate">
                  {item.subject} • {item.tags?.[0] || "High Yield"}
                </span>

                {q && q.options && q.options.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="text-[10px] font-bold text-[#00685f] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    {isExpanded ? (
                      <>
                        Close <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Solve <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Bottom Actions: Engagement & Save Button */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2.5 text-stone-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {120 + (item.title.length % 50)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {item.tags?.length || 2}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSave(item)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSaved
                      ? "bg-[#ECF7F5] text-[#00685f] border border-[#d2ebe6]"
                      : "bg-stone-50 hover:bg-stone-100 text-slate-600 border border-stone-200"
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      isSaved ? "fill-[#00685f] text-[#00685f]" : "text-slate-400"
                    }`}
                  />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
