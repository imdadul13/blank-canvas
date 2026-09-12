import React, { useState } from "react";
import {
  HelpCircle,
  Image as ImageIcon,
  Video as VideoIcon,
  Award,
  Lightbulb,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Maximize2,
  CheckCircle2,
  XCircle,
  Layers,
  Flame,
  Check,
} from "lucide-react";
import { CanonicalKnowledgeItem } from "../../types";

export interface UnifiedKnowledgeItem {
  id: string;
  type: "question" | "image" | "video" | "pearl" | "tip" | "notice";
  title: string;
  stem?: string;
  content?: string;
  subject: string;
  topic?: string;
  tags?: string[];
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "POLL" | "NONE";
  pearlTakeaway?: string;
  whatToRemember?: string;
  options?: { key: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  distractorAnalysis?: { key: string; reason: string }[];
  sources?: { sourceId?: string; sourceTitle: string; messageId?: string | number; date?: string }[];
  fmgeRelevanceScore?: number;
  isHighYield?: boolean;
  originalData?: any;
  isSaved?: boolean;
}

interface TelegramKnowledgeCardsProps {
  items: (CanonicalKnowledgeItem | UnifiedKnowledgeItem)[];
  savedItemIds: Set<string>;
  onToggleSave: (item: any) => void;
  onOpenImageZoom?: (url: string) => void;
  onPracticeQuestion?: (question: any) => void;
  selectedAnswers?: Record<string, string>;
  onSelectOption?: (questionId: string, optionKey: string, isCorrect: boolean) => void;
  onAddToErrorNotebook?: (item: any) => void;
  onSaveAsPearl?: (pearl: any) => void;
}

export const TelegramKnowledgeCards: React.FC<TelegramKnowledgeCardsProps> = ({
  items,
  savedItemIds,
  onToggleSave,
  onOpenImageZoom,
  onPracticeQuestion,
  selectedAnswers: externalSelectedAnswers,
  onSelectOption,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [localSelections, setLocalSelections] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "";
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0 || isNaN(diffMs)) return "";
    const diffMin = Math.max(1, Math.round(diffMs / 60000));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "question":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
            <HelpCircle className="w-3 h-3 text-sky-600" />
            Question
          </span>
        );
      case "image":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#00685f] border border-teal-200">
            <ImageIcon className="w-3 h-3 text-[#00685f]" />
            Image Spotter
          </span>
        );
      case "video":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <VideoIcon className="w-3 h-3 text-purple-600" />
            Clinical Video
          </span>
        );
      case "pearl":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <Award className="w-3 h-3 text-rose-600" />
            Exam Pearl
          </span>
        );
      case "tip":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            <Lightbulb className="w-3 h-3 text-amber-600" />
            Clinical Tip
          </span>
        );
      default:
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
          No curated items match your selected filters. Try changing your subject or search keyword.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
      {items.map((rawItem: any) => {
        const item = rawItem;
        const isSaved = savedItemIds.has(item.id);
        const isExpanded = !!expandedItems[item.id];
        const isQuestion = item.type === "question" || item.type === "image" || item.type === "video";
        const options: { key: string; text: string }[] = item.options || item.originalData?.options || [];
        const correctAnswer = (item.correctAnswer || item.originalData?.correctAnswer || "").toUpperCase();
        const explanation = item.explanation || item.originalData?.explanation || "";
        const whatToRemember = item.whatToRemember || item.pearlTakeaway || "";
        const distractorAnalysis = item.distractorAnalysis || item.originalData?.whyOtherOptionsAreWrong || [];
        const sources: any[] = item.sources || (item.originalData?.sourceChannel ? [{ sourceTitle: item.originalData.sourceChannel }] : []);
        const mediaUrl = item.mediaUrl || item.imageUrl || item.videoUrl;
        const isVideo = item.type === "video" || item.mediaType === "VIDEO";

        const selectedKey = externalSelectedAnswers?.[item.id] || localSelections[item.id];
        const isAnswered = Boolean(selectedKey);

        // Provenance Attribution wording
        const provenanceText =
          sources.length > 1
            ? `Found in ${sources.length} sources`
            : sources.length === 1 && sources[0]?.sourceTitle
            ? `Source: ${sources[0].sourceTitle}`
            : "FMGE Channel";

        return (
          <div
            key={item.id}
            className="h-full rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:border-teal-200 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Card Header: Type Badge, High-Yield Indicator & Time */}
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {getTypeBadge(item.type)}
                  {(item.isHighYield || (item.fmgeRelevanceScore && item.fmgeRelevanceScore >= 75)) && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                      <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                      High-Yield
                    </span>
                  )}
                </div>

                {item.createdAt && (
                  <span className="text-[11px] text-slate-400 font-medium shrink-0 font-mono">
                    {getRelativeTime(item.createdAt)}
                  </span>
                )}
              </div>

              {/* Subject and Topic tag */}
              <div className="mb-2 text-[11px] font-semibold text-[#00685f] capitalize tracking-wide flex items-center gap-1.5">
                <span>{item.subject}</span>
                {item.topic && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium truncate max-w-[200px]">{item.topic}</span>
                  </>
                )}
              </div>

              {/* Media Thumbnail if present */}
              {mediaUrl && !isVideo && (
                <div className="relative mb-3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 aspect-16/10 group/img">
                  <img
                    src={mediaUrl}
                    alt={item.title || "Clinical Asset"}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  {onOpenImageZoom && (
                    <button
                      type="button"
                      onClick={() => onOpenImageZoom(mediaUrl)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Zoom Image
                    </button>
                  )}
                </div>
              )}

              {/* Video Thumbnail if present */}
              {mediaUrl && isVideo && (
                <div className="relative mb-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-16/10 flex items-center justify-center">
                  <video src={mediaUrl} controls className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title / Content */}
              {item.type === "pearl" ? (
                <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-100/70 mb-2.5 text-xs text-slate-900 leading-relaxed font-serif italic min-h-[52px]">
                  “{item.content || item.title}”
                </div>
              ) : (
                <div className="text-xs font-semibold text-slate-900 leading-relaxed mb-2.5 min-h-[44px]">
                  {item.content || item.title}
                </div>
              )}

              {/* Compact "Remember" Section for Exam Pearls / Tips */}
              {whatToRemember && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 mb-2.5 leading-relaxed">
                  <span className="font-bold text-amber-900 block mb-0.5 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-600" />
                    Remember for FMGE:
                  </span>
                  <span>{whatToRemember}</span>
                </div>
              )}

              {/* Interactive MCQ drawer if question and options exist */}
              {isQuestion && options && options.length > 0 && isExpanded && (
                <div className="space-y-1.5 pt-2 pb-2 border-t border-stone-100 mb-2.5 animate-fadeIn">
                  {options.map((opt, idx) => {
                    const optKey = opt.key || String.fromCharCode(65 + idx);
                    const isSelected = selectedKey === optKey;
                    const isCorrect = correctAnswer ? optKey.toUpperCase() === correctAnswer : false;

                    let btnClass = "border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-slate-700";

                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = "border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold";
                      } else if (isSelected && !isCorrect) {
                        btnClass = "border-rose-400 bg-rose-50 text-rose-950 font-semibold";
                      } else {
                        btnClass = "border-stone-100 bg-white text-slate-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => {
                          if (isAnswered) return;
                          setLocalSelections((prev) => ({ ...prev, [item.id]: optKey }));
                          if (onSelectOption) {
                            onSelectOption(item.id, optKey, isCorrect);
                          }
                        }}
                        disabled={isAnswered}
                        className={`w-full text-left p-2.5 rounded-xl text-xs border transition-all cursor-pointer flex items-start justify-between gap-2 ${btnClass}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {optKey}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>
                        {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}

                  {/* Solved Explanation & Distractor Analysis */}
                  {isAnswered && explanation && (
                    <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 text-[11px] text-teal-950 leading-relaxed mt-2.5 space-y-1.5 animate-fadeIn">
                      <div>
                        <span className="font-bold text-[#00685f] block mb-0.5">
                          ✓ Correct Answer: Option {correctAnswer || "A"}
                        </span>
                        <p className="text-slate-700">{explanation}</p>
                      </div>

                      {distractorAnalysis && distractorAnalysis.length > 0 && (
                        <div className="pt-1.5 border-t border-teal-200/60 mt-1.5 space-y-1">
                          <span className="font-bold text-slate-800 block text-[10.5px]">Why Other Options Are Wrong:</span>
                          {distractorAnalysis.map((d: any, i: number) => (
                            <p key={i} className="text-slate-600 text-[10.5px]">
                              <strong>Option {d.key}:</strong> {d.reason}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card Footer: Source Attribution & Action Buttons */}
            <div className="pt-2.5 border-t border-stone-100 space-y-2 mt-auto">
              {/* Provenance Line */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-slate-600 truncate max-w-[220px]" title={provenanceText}>
                  {provenanceText}
                </span>

                {isQuestion && options && options.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="text-[11px] font-bold text-[#00685f] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    {isExpanded ? (
                      <>
                        Collapse <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        Solve <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Bottom Actions: Practice Similar & Save Button */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                {isQuestion && onPracticeQuestion ? (
                  <button
                    type="button"
                    onClick={() => onPracticeQuestion(item)}
                    className="text-[11px] font-semibold text-[#00685f] hover:text-[#005049] hover:underline cursor-pointer"
                  >
                    Practice Similar →
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => onToggleSave(item)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSaved
                      ? "bg-[#ECF7F5] text-[#00685f] border border-[#d2ebe6]"
                      : "bg-stone-50 hover:bg-stone-100 text-slate-700 border border-stone-200"
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
