import React from 'react';
import { sanitizeLatexAndMath } from '../utils/textFormatting';
import {
  Brain,
  Stethoscope,
  Pill,
  Activity,
  Compass,
  AlertTriangle,
  Lightbulb,
  Award,
  Bookmark,
} from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Helper component to pick an authentic clinical faculty icon based on the section title.
 */
const ClinicalIcon: React.FC<{ title: string }> = ({ title }) => {
  const lower = title.toLowerCase();
  if (/patho|mechanis|etiolog|physio|reason|cognit|brain|neuro|genet/.test(lower)) {
    return <Brain className="h-3.5 w-3.5" />;
  }
  if (/diagnos|investig|criteri|sign|symptom|clinic|present|ecg|x-ray|triad|examin|stetho|finding/.test(lower)) {
    return <Stethoscope className="h-3.5 w-3.5" />;
  }
  if (/treat|drug|pharmac|manag|therap|regimen|first-line|dose|prescri|anti|choice/.test(lower)) {
    return <Pill className="h-3.5 w-3.5" />;
  }
  if (/coach|advice|strategy|action plan|priority|eve|guidance/.test(lower)) {
    return <Compass className="h-3.5 w-3.5" />;
  }
  if (/pearl|trap|high-yield|mnemonic|remember|nbe|nbems|exam|yield|tip|gold|takeaway|association/.test(lower)) {
    return <Award className="h-3.5 w-3.5" />;
  }
  return <Activity className="h-3.5 w-3.5" />;
};

type CalloutType = 'coaching' | 'trap' | 'pearl' | 'gold_standard' | 'classic_assoc' | 'info';

interface CalloutParsed {
  type: CalloutType;
  badge: string;
  cleanText: string;
}

/**
 * Parses a callout lead line and extracts category, badge, and cleaned clinical text.
 */
const parseCalloutLead = (rawText: string): CalloutParsed => {
  let text = rawText.trim();
  text = text.replace(/^>\s*/, '').replace(/^[💡⚠️🧠🎯]\s*/, '').trim();
  const lower = text.toLowerCase();

  // 1. Personalized Coaching / Strategy
  if (
    /^(?:\*\*)?(?:exam eve|coach(?:'s)? advice|action plan|priority for the next|personalized advice|coaching guidance|study strategy)/i.test(lower)
  ) {
    const clean = text.replace(/^\*\*(?:exam eve|coach(?:'s)? advice|action plan|priority for the next|personalized advice|coaching guidance|study strategy)[^*]*\*\*[:\s-]*/i, '');
    return {
      type: 'coaching',
      badge: 'Faculty Coaching & Strategy',
      cleanText: clean || text,
    };
  }

  // 2. Exam Trap / Warning / Pitfall
  if (
    /^(?:\*\*)?(?:exam trap|nbe trap|fmge trap|warning|pitfall|common mistake|caution|beware of|contraindication)/i.test(lower) ||
    rawText.includes('⚠️')
  ) {
    const clean = text.replace(/^\*\*(?:exam trap|nbe trap|fmge trap|warning|pitfall|common mistake|caution|beware of|contraindication)[^*]*\*\*[:\s-]*/i, '');
    return {
      type: 'trap',
      badge: 'FMGE Exam Trap',
      cleanText: clean || text,
    };
  }

  // 3. Drug of Choice / Diagnostic Gold Standard
  if (
    /^(?:\*\*)?(?:drug of choice|first-line drug|investigation of choice|gold standard|best initial test|confirmatory test|treatment of choice)/i.test(lower)
  ) {
    const isDrug = /drug|treatment|regimen|dose/i.test(lower);
    const clean = text.replace(/^\*\*(?:drug of choice|first-line drug|investigation of choice|gold standard|best initial test|confirmatory test|treatment of choice)[^*]*\*\*[:\s-]*/i, '');
    return {
      type: 'gold_standard',
      badge: isDrug ? 'Drug of Choice' : 'Diagnostic Gold Standard',
      cleanText: clean || text,
    };
  }

  // 4. Classic Exam Association / Hallmark
  if (
    /^(?:\*\*)?(?:classic association|hallmark finding|pathognomonic|classic triad|differential diagnosis)/i.test(lower)
  ) {
    const clean = text.replace(/^\*\*(?:classic association|hallmark finding|pathognomonic|classic triad|differential diagnosis)[^*]*\*\*[:\s-]*/i, '');
    return {
      type: 'classic_assoc',
      badge: 'Classic Exam Association',
      cleanText: clean || text,
    };
  }

  // 5. High-Yield Pearl / Key Takeaway / Mnemonic
  if (
    /^(?:\*\*)?(?:high-yield pearl|clinical pearl|fmge pearl|nbe pearl|key takeaway|high-yield takeaway|exam pearl|quick takeaway|high yield|mnemonic|remember)/i.test(lower) ||
    rawText.includes('💡') ||
    rawText.includes('🧠')
  ) {
    const isTakeaway = /takeaway/i.test(lower);
    const clean = text.replace(/^\*\*(?:high-yield pearl|clinical pearl|fmge pearl|nbe pearl|key takeaway|high-yield takeaway|exam pearl|quick takeaway|high yield|mnemonic|remember)[^*]*\*\*[:\s-]*/i, '');
    return {
      type: 'pearl',
      badge: isTakeaway ? 'FMGE Key Takeaway' : 'High-Yield Pearl',
      cleanText: clean || text,
    };
  }

  // Fallback clinical annotation
  const clean = text.replace(/^\*\*(?:important reminder|clinical note|reminder)[^*]*\*\*[:\s-]*/i, '');
  return {
    type: 'info',
    badge: 'Clinical Annotation',
    cleanText: clean || text,
  };
};

/**
 * Checks if a trimmed line is a clinical callout or annotated trigger.
 */
const isCalloutLead = (line: string): boolean => {
  const t = line.trim();
  if (/^[💡⚠️🧠🎯]/.test(t) || t.startsWith('>')) return true;
  return /^\*\*(?:FMGE|NBE|Exam Trap|Clinical Pearl|High-Yield|Key Takeaway|Diagnostic Gold Standard|Drug of Choice|First-Line Drug|Investigation of Choice|Classic Association|Pathognomonic|Important Reminder|Action Plan|Coach's Advice|Exam Eve Strategy|Takeaway|Pearl|Warning|Trap|Gold Standard)[^*]*\*\*/i.test(t);
};

/**
 * Renders a structured clinical callout annotation.
 */
const renderCalloutBlock = (
  key: string,
  type: CalloutType,
  badge: string,
  cleanText: string,
  formatInline: (t: string) => React.ReactNode[]
): React.ReactNode => {
  if (type === 'coaching') {
    return (
      <div
        key={key}
        className="w-full my-3.5 p-4 sm:p-5 rounded-2xl bg-[#f0fdf9] border border-teal-200/90 shadow-2xs space-y-2.5 break-words"
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-100/90 text-teal-900 border border-teal-300/80 font-['Outfit']">
            {badge}
          </span>
        </div>
        <div className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans pl-0.5">
          {formatInline(cleanText)}
        </div>
      </div>
    );
  }

  if (type === 'trap') {
    return (
      <div
        key={key}
        className="w-full my-3 p-3.5 sm:p-4 rounded-2xl bg-[#fffbeb] border border-amber-200/90 shadow-2xs space-y-2 break-words"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-3 w-3" />
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80 font-['Outfit']">
            {badge}
          </span>
        </div>
        <div className="text-amber-950/90 text-xs sm:text-sm leading-relaxed font-sans">
          {formatInline(cleanText)}
        </div>
      </div>
    );
  }

  if (type === 'pearl') {
    return (
      <div
        key={key}
        className="w-full my-3 p-3.5 sm:p-4 rounded-2xl bg-[#f0fdf4] border border-emerald-200/90 shadow-2xs space-y-2 break-words"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
            <Lightbulb className="h-3 w-3" />
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300/80 font-['Outfit']">
            {badge}
          </span>
        </div>
        <div className="text-emerald-950/90 text-xs sm:text-sm leading-relaxed font-sans">
          {formatInline(cleanText)}
        </div>
      </div>
    );
  }

  if (type === 'gold_standard') {
    return (
      <div
        key={key}
        className="w-full my-3 p-3.5 sm:p-4 rounded-2xl bg-[#f0f9ff] border border-sky-200/90 shadow-2xs space-y-2 break-words"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
            {badge.includes('Drug') ? <Pill className="h-3 w-3" /> : <Award className="h-3 w-3" />}
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 font-['Outfit']">
            {badge}
          </span>
        </div>
        <div className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans">
          {formatInline(cleanText)}
        </div>
      </div>
    );
  }

  if (type === 'classic_assoc') {
    return (
      <div
        key={key}
        className="w-full my-3 p-3.5 sm:p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/90 shadow-2xs space-y-2 break-words"
      >
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Bookmark className="h-3 w-3" />
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-['Outfit']">
            {badge}
          </span>
        </div>
        <div className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans">
          {formatInline(cleanText)}
        </div>
      </div>
    );
  }

  return (
    <div
      key={key}
      className="w-full my-3 p-3.5 sm:p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 shadow-2xs space-y-1.5 break-words"
    >
      <div className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 font-['Outfit']">
          {badge}
        </span>
      </div>
      <div className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans">
        {formatInline(cleanText)}
      </div>
    </div>
  );
};

/**
 * Splits text by arrow symbols (-> or --> or →) and renders styled clinical transition arrows.
 */
const renderTextWithArrows = (str: string, baseKey: string): React.ReactNode[] => {
  if (!str.includes('->') && !str.includes('-->') && !str.includes('→')) {
    return [str];
  }
  const parts = str.split(/(?:\s*->\s*|\s*-->\s*|\s*→\s*)/g);
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, pIdx) => {
    if (pIdx > 0) {
      nodes.push(
        <span key={`${baseKey}-arr-${pIdx}`} className="text-sky-600 font-bold mx-1.5 inline-block select-none">
          →
        </span>
      );
    }
    if (part) {
      nodes.push(part);
    }
  });
  return nodes;
};

/**
 * High-performance, robust Markdown Renderer for FMGE AI Coach.
 * Accurately parses headings, bullet lists, numbered lists, tables, callouts, and paragraphs line-by-line.
 * Automatically wraps clinical teaching sections into elegant editorial cards with icons and sub-topic capsule pills.
 * Sanitizes LaTeX math notation ($\ge$, $\rightarrow$, $m^2$) into clean Unicode symbols.
 * Uses bulletproof loop advancement to strictly prevent any infinite rendering freeze on streaming or malformed AI output.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Clean raw LaTeX formatting, math notation and special characters
  const cleanContent = sanitizeLatexAndMath(content);

  // Helper for inline tokens: bold (**text**), italic (*text*), code (`code`)
  const formatInline = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const tokens: React.ReactNode[] = [];
    const pattern = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let keyIdx = 0;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const plain = text.substring(lastIndex, match.index);
        tokens.push(...renderTextWithArrows(plain, `t-${keyIdx++}`));
      }

      if (match[1] && match[2]) {
        const innerText = match[2];
        const lowerInner = innerText.toLowerCase().trim();
        const isAnchor =
          lowerInner.startsWith('gold standard') ||
          lowerInner.startsWith('first-line') ||
          lowerInner.startsWith('most common') ||
          lowerInner.startsWith('most sensitive') ||
          lowerInner.startsWith('most specific') ||
          lowerInner.startsWith('contraindicated') ||
          lowerInner.startsWith('classic presentation') ||
          lowerInner.startsWith('key investigation') ||
          lowerInner.startsWith('important complication') ||
          lowerInner.startsWith('fmge pearl');

        if (isAnchor) {
          tokens.push(
            <span
              key={`b-${keyIdx++}`}
              className="inline-flex items-center gap-1 font-bold text-slate-900 bg-teal-50/80 px-1.5 py-0.5 rounded border border-teal-200/70 shadow-2xs font-['Outfit']"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#006B63] shrink-0" />
              {innerText}
            </span>
          );
        } else {
          tokens.push(
            <strong key={`b-${keyIdx++}`} className="font-bold text-slate-950">
              {innerText}
            </strong>
          );
        }
      } else if (match[3] && match[4]) {
        tokens.push(
          <em key={`i-${keyIdx++}`} className="italic text-slate-800">
            {match[4]}
          </em>
        );
      } else if (match[5] && match[6]) {
        tokens.push(
          <code key={`c-${keyIdx++}`} className="bg-slate-100 text-sky-800 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200">
            {match[6]}
          </code>
        );
      }

      // Safeguard against zero-width match causing infinite loop
      if (pattern.lastIndex === match.index) {
        pattern.lastIndex++;
      }
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      const plain = text.substring(lastIndex);
      tokens.push(...renderTextWithArrows(plain, `t-${keyIdx++}`));
    }

    return tokens.length > 0 ? tokens : renderTextWithArrows(text, 'fb');
  };

  // Split sanitized content into lines and group into structured blocks
  const rawLines = cleanContent.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  try {
    while (i < rawLines.length) {
      const startIndex = i;
      const line = rawLines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // 0. Horizontal Rule (---, ***, ___)
      if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
        blocks.push(
          <hr key={`hr-${blocks.length}`} className="w-full my-3 border-slate-200" />
        );
        i++;
        continue;
      }

      // 1. Table Detection (any consecutive lines starting with |)
      if (trimmed.startsWith('|')) {
        const tableLines: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
          tableLines.push(rawLines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
          const rowLines = tableLines.slice(1).filter(l => !l.includes('---'));

          blocks.push(
            <div key={`table-${blocks.length}`} className="w-full my-3 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {headerCells.map((h, hIdx) => (
                      <th key={`th-${hIdx}`} className="py-2.5 px-3.5 font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider text-[11px]">
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rowLines.map((row, rIdx) => {
                    const cells = row.split('|').slice(1, -1).map(c => c.trim());
                    return (
                      <tr key={`tr-${rIdx}`} className="hover:bg-slate-50/60 transition-colors">
                        {cells.map((cell, cIdx) => (
                          <td key={`td-${cIdx}`} className="py-2.5 px-3.5 text-slate-700 leading-relaxed">
                            {formatInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        } else if (tableLines.length === 1) {
          blocks.push(
            <p key={`p-${blocks.length}`} className="w-full text-xs sm:text-sm leading-relaxed text-slate-700 my-2 break-words font-sans">
              {formatInline(tableLines[0])}
            </p>
          );
        }
        continue;
      }

      // 2. Headings & Clinical Teaching Sections (#, ##, ###, or numbered headings like "1. ...", "## 1. ...")
      const headingMatch =
        trimmed.match(/^(#{1,4})\s+(.+)$/) ||
        trimmed.match(/^(\d+\.)\s+\*\*(.+?)\*\*$/) ||
        trimmed.match(/^\*\*(\d+\..+?)\*\*$/);

      if (headingMatch) {
        const level = headingMatch[1].startsWith('#') ? headingMatch[1].length : 2;
        const headingText = headingMatch[2] || headingMatch[1];
        const cleanHeadingText = headingText.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

        // Check if this is a Personalized Coaching / Strategy Section
        const isCoachingSection = /exam eve|coach(?:'s)? advice|action plan|priority for the next|personalized advice|coaching guidance|study strategy/i.test(cleanHeadingText);

        // If it's a major clinical section (level 1-3, coaching section, or starts with a number like "1. "):
        // We package this section into a structured Clinical Teaching Card or Coaching Panel
        if (level <= 3 || isCoachingSection || /^\d+\./.test(cleanHeadingText)) {
          i++; // Advance past heading line

          // Check if the immediately following non-empty line is a thematic Sub-Topic Capsule (e.g. **Chronic Inflammation & Airway Remodeling**)
          let capsuleText: string | null = null;
          while (i < rawLines.length && !rawLines[i].trim()) {
            i++;
          }
          if (i < rawLines.length) {
            const nextTrim = rawLines[i].trim();
            const isNotStructural =
              !nextTrim.startsWith('- ') &&
              !nextTrim.startsWith('* ') &&
              !nextTrim.startsWith('• ') &&
              !nextTrim.startsWith('+ ') &&
              !nextTrim.startsWith('|') &&
              !nextTrim.startsWith('#') &&
              !isCalloutLead(nextTrim) &&
              !/^\d+\.\s/.test(nextTrim);

            if (isNotStructural) {
              const boldMatch = nextTrim.match(/^\*\*([^*]+)\*\*$/);
              const h4Match = nextTrim.match(/^#{4,6}\s+(.+)$/);
              if (boldMatch && boldMatch[1].length < 90 && !boldMatch[1].endsWith(':')) {
                capsuleText = boldMatch[1].trim();
                i++;
              } else if (h4Match && h4Match[1].length < 90) {
                capsuleText = h4Match[1].trim();
                i++;
              }
            }
          }

          // Collect inner blocks for this clinical section until next major section heading or end
          const sectionInnerBlocks: React.ReactNode[] = [];
          while (i < rawLines.length) {
            const secLine = rawLines[i].trim();
            if (!secLine) {
              i++;
              continue;
            }

            // If we encounter a new major section heading, break out so the outer loop handles it
            const nextHeadMatch =
              secLine.match(/^(#{1,3})\s+(.+)$/) ||
              secLine.match(/^(\d+\.)\s+\*\*(.+?)\*\*$/) ||
              secLine.match(/^\*\*(\d+\..+?)\*\*$/);
            if (nextHeadMatch) {
              break;
            }

            const secStartIndex = i;

            // Table inside section
            if (secLine.startsWith('|')) {
              const tableLines: string[] = [];
              while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
                tableLines.push(rawLines[i].trim());
                i++;
              }
              if (tableLines.length >= 2) {
                const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
                const rowLines = tableLines.slice(1).filter(l => !l.includes('---'));
                sectionInnerBlocks.push(
                  <div key={`sec-tbl-${sectionInnerBlocks.length}`} className="w-full my-2.5 overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {headerCells.map((h, hIdx) => (
                            <th key={`th-${hIdx}`} className="py-2 px-3 font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider text-[11px]">
                              {formatInline(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {rowLines.map((row, rIdx) => {
                          const cells = row.split('|').slice(1, -1).map(c => c.trim());
                          return (
                            <tr key={`tr-${rIdx}`} className="hover:bg-slate-50/60 transition-colors">
                              {cells.map((cell, cIdx) => (
                                <td key={`td-${cIdx}`} className="py-2 px-3 text-slate-700">
                                  {formatInline(cell)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }
              continue;
            }

            // Callout inside section (Pearls, Traps, Gold Standards, Takeaways, Warnings)
            if (isCalloutLead(secLine)) {
              const calloutLines: string[] = [];
              while (
                i < rawLines.length &&
                rawLines[i].trim() &&
                (isCalloutLead(rawLines[i]) ||
                  (calloutLines.length > 0 &&
                    !rawLines[i].trim().startsWith('#') &&
                    !rawLines[i].trim().startsWith('- ') &&
                    !rawLines[i].trim().startsWith('* ') &&
                    !rawLines[i].trim().startsWith('• ') &&
                    !rawLines[i].trim().startsWith('+ ') &&
                    !rawLines[i].trim().startsWith('|') &&
                    !/^\d+\.\s/.test(rawLines[i].trim())))
              ) {
                calloutLines.push(rawLines[i].trim());
                i++;
              }
              if (calloutLines.length > 0) {
                const fullCalloutText = calloutLines.join(' ');
                const parsed = parseCalloutLead(fullCalloutText);
                sectionInnerBlocks.push(
                  renderCalloutBlock(
                    `sec-callout-${sectionInnerBlocks.length}`,
                    parsed.type,
                    parsed.badge,
                    parsed.cleanText,
                    formatInline
                  )
                );
              }
              continue;
            }

            // Bullet lists inside section (- , * , • , + )
            if (secLine.startsWith('- ') || secLine.startsWith('* ') || secLine.startsWith('• ') || secLine.startsWith('+ ')) {
              const listItems: string[] = [];
              while (
                i < rawLines.length &&
                (rawLines[i].trim().startsWith('- ') ||
                  rawLines[i].trim().startsWith('* ') ||
                  rawLines[i].trim().startsWith('• ') ||
                  rawLines[i].trim().startsWith('+ '))
              ) {
                listItems.push(rawLines[i].trim().replace(/^[-*•+]\s+/, ''));
                i++;
              }
              sectionInnerBlocks.push(
                <ul key={`sec-ul-${sectionInnerBlocks.length}`} className="w-full my-2 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {listItems.map((item, idx) => (
                    <li key={`sec-li-${idx}`} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                      <span className="flex-1 break-words leading-relaxed">{formatInline(item)}</span>
                    </li>
                  ))}
                </ul>
              );
              continue;
            }

            // Numbered list inside section (1. , 2. )
            if (/^\d+\.\s/.test(secLine)) {
              const numItems: string[] = [];
              while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i].trim())) {
                numItems.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
                i++;
              }
              sectionInnerBlocks.push(
                <ol key={`sec-ol-${sectionInnerBlocks.length}`} className="w-full my-2 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {numItems.map((item, idx) => (
                    <li key={`sec-oli-${idx}`} className="flex items-start gap-2.5">
                      <span className="font-bold text-sky-800 font-mono text-[11px] mt-0.5 shrink-0 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/60">
                        {idx + 1}
                      </span>
                      <span className="flex-1 break-words leading-relaxed">{formatInline(item)}</span>
                    </li>
                  ))}
                </ol>
              );
              continue;
            }

            // Sub-headings inside section (level 4 or bold sub-header)
            const subHeadingMatch = secLine.match(/^#{4,6}\s+(.+)$/) || secLine.match(/^\*\*([^*]+)\*\*$/);
            if (subHeadingMatch && subHeadingMatch[1].length < 80) {
              sectionInnerBlocks.push(
                <div key={`sec-sub-${sectionInnerBlocks.length}`} className="pt-1.5 pb-0.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f4fc] text-[#006080] border border-sky-200/70 font-['Outfit']">
                    {formatInline(subHeadingMatch[1].trim())}
                  </span>
                </div>
              );
              i++;
              continue;
            }

            // Regular paragraph inside section
            const pLines: string[] = [];
            while (
              i < rawLines.length &&
              rawLines[i].trim() &&
              !rawLines[i].trim().startsWith('#') &&
              !rawLines[i].trim().startsWith('- ') &&
              !rawLines[i].trim().startsWith('* ') &&
              !rawLines[i].trim().startsWith('• ') &&
              !rawLines[i].trim().startsWith('+ ') &&
              !rawLines[i].trim().startsWith('|') &&
              !rawLines[i].trim().startsWith('>') &&
              !isCalloutLead(rawLines[i].trim()) &&
              !/^\d+\.\s/.test(rawLines[i].trim())
            ) {
              pLines.push(rawLines[i].trim());
              i++;
            }
            if (pLines.length > 0) {
              sectionInnerBlocks.push(
                <p key={`sec-p-${sectionInnerBlocks.length}`} className="w-full text-xs sm:text-sm leading-relaxed text-slate-700 my-1.5 break-words font-sans">
                  {formatInline(pLines.join(' '))}
                </p>
              );
            }

            // Fallback progress safeguard inside section
            if (i === secStartIndex) {
              sectionInnerBlocks.push(
                <p key={`sec-pfb-${sectionInnerBlocks.length}`} className="w-full text-xs sm:text-sm leading-relaxed text-slate-700 my-1 break-words font-sans">
                  {formatInline(secLine)}
                </p>
              );
              i++;
            }
          }

          // Push the completed clinical teaching card or coaching card
          if (isCoachingSection) {
            blocks.push(
              <div
                key={`sec-coach-${blocks.length}`}
                className="w-full my-3.5 p-4 sm:p-5 rounded-2xl bg-[#f0fdf9] border border-teal-200/90 shadow-2xs space-y-3 break-words"
              >
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-teal-100">
                  <div className="h-7 w-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <Compass className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 font-['Outfit']">
                      Faculty Coaching & Strategy
                    </span>
                    <h3 className="font-['Outfit'] font-bold text-teal-950 text-sm sm:text-base leading-snug">
                      {formatInline(cleanHeadingText)}
                    </h3>
                  </div>
                </div>

                {capsuleText && (
                  <div className="pt-0.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/70 text-teal-900 border border-teal-200/80 font-['Outfit']">
                      {formatInline(capsuleText)}
                    </span>
                  </div>
                )}

                {sectionInnerBlocks.length > 0 && (
                  <div className="space-y-2.5 text-slate-800">
                    {sectionInnerBlocks}
                  </div>
                )}
              </div>
            );
          } else {
            blocks.push(
              <div
                key={`sec-${blocks.length}`}
                className="w-full my-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-[#d6eaf8] shadow-2xs space-y-3 break-words"
              >
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-sky-100">
                  <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <ClinicalIcon title={cleanHeadingText} />
                  </div>
                  <h3 className="font-['Outfit'] font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {formatInline(cleanHeadingText)}
                  </h3>
                </div>

                {capsuleText && (
                  <div className="pt-0.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f4fc] text-[#006080] border border-sky-200/70 font-['Outfit']">
                      {formatInline(capsuleText)}
                    </span>
                  </div>
                )}

                {sectionInnerBlocks.length > 0 && (
                  <div className="space-y-2.5 text-slate-700">
                    {sectionInnerBlocks}
                  </div>
                )}
              </div>
            );
          }
          continue;
        } else {
          // Level 4+ heading outside section
          blocks.push(
            <h4 key={`h4-${blocks.length}`} className="w-full text-xs sm:text-sm font-bold font-['Outfit'] text-slate-900 mt-3 mb-1">
              {formatInline(cleanHeadingText)}
            </h4>
          );
          i++;
          continue;
        }
      }

      // 3. Clinical Callouts / Alert Boxes outside section (Pearls, Traps, Gold Standards, Takeaways, Warnings, Coaching)
      if (isCalloutLead(trimmed)) {
        const calloutLines: string[] = [];
        while (
          i < rawLines.length &&
          rawLines[i].trim() &&
          (isCalloutLead(rawLines[i]) ||
            (calloutLines.length > 0 &&
              !rawLines[i].trim().startsWith('#') &&
              !rawLines[i].trim().startsWith('- ') &&
              !rawLines[i].trim().startsWith('* ') &&
              !rawLines[i].trim().startsWith('• ') &&
              !rawLines[i].trim().startsWith('+ ') &&
              !rawLines[i].trim().startsWith('|') &&
              !/^\d+\.\s/.test(rawLines[i].trim())))
        ) {
          calloutLines.push(rawLines[i].trim());
          i++;
        }

        if (calloutLines.length > 0) {
          const fullCalloutText = calloutLines.join(' ');
          const parsed = parseCalloutLead(fullCalloutText);
          blocks.push(
            renderCalloutBlock(
              `callout-${blocks.length}`,
              parsed.type,
              parsed.badge,
              parsed.cleanText,
              formatInline
            )
          );
        }
        continue;
      }

      // 4. Bullet Lists outside section (- , * , • , + )
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('+ ')) {
        const listItems: string[] = [];
        while (
          i < rawLines.length &&
          (rawLines[i].trim().startsWith('- ') ||
            rawLines[i].trim().startsWith('* ') ||
            rawLines[i].trim().startsWith('• ') ||
            rawLines[i].trim().startsWith('+ '))
        ) {
          listItems.push(rawLines[i].trim().replace(/^[-*•+]\s+/, ''));
          i++;
        }

        blocks.push(
          <ul key={`ul-${blocks.length}`} className="w-full my-2.5 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={`li-${idx}`} className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span className="flex-1 break-words leading-relaxed">{formatInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 5. Numbered Lists outside section (1. , 2. )
      if (/^\d+\.\s/.test(trimmed)) {
        const numItems: string[] = [];
        while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i].trim())) {
          numItems.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }

        blocks.push(
          <ol key={`ol-${blocks.length}`} className="w-full my-2.5 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {numItems.map((item, idx) => (
              <li key={`oli-${idx}`} className="flex items-start gap-2.5">
                <span className="font-bold text-sky-800 font-mono text-[11px] mt-0.5 shrink-0 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/60">
                  {idx + 1}
                </span>
                <span className="flex-1 break-words leading-relaxed">{formatInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 6. Regular Paragraphs (e.g. conversational opening statement or transition)
      const paragraphLines: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim() &&
        !rawLines[i].trim().startsWith('#') &&
        !rawLines[i].trim().startsWith('- ') &&
        !rawLines[i].trim().startsWith('* ') &&
        !rawLines[i].trim().startsWith('• ') &&
        !rawLines[i].trim().startsWith('+ ') &&
        !rawLines[i].trim().startsWith('|') &&
        !rawLines[i].trim().startsWith('>') &&
        !isCalloutLead(rawLines[i].trim()) &&
        !/^\d+\.\s/.test(rawLines[i].trim()) &&
        !/^(?:---|\*\*\*|___)\s*$/.test(rawLines[i].trim())
      ) {
        paragraphLines.push(rawLines[i].trim());
        i++;
      }

      if (paragraphLines.length > 0) {
        blocks.push(
          <p key={`p-${blocks.length}`} className="w-full text-xs sm:text-sm leading-relaxed text-slate-700 my-2 break-words font-sans">
            {formatInline(paragraphLines.join(' '))}
          </p>
        );
      }

      // Strict guaranteed advancement: if no block handler advanced the index, increment i by 1
      if (i === startIndex) {
        blocks.push(
          <p key={`p-fallback-${blocks.length}`} className="w-full text-xs sm:text-sm leading-relaxed text-slate-700 my-1 break-words font-sans">
            {formatInline(trimmed)}
          </p>
        );
        i++;
      }
    }

    return (
      <div className={`w-full max-w-none text-slate-800 space-y-2 font-['Plus_Jakarta_Sans'] ${className}`}>
        {blocks}
      </div>
    );
  } catch (err) {
    console.warn('Markdown parsing fallback activated:', err);
    return (
      <div className={`w-full max-w-none text-slate-800 space-y-2 font-['Plus_Jakarta_Sans'] ${className}`}>
        <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700 break-words font-sans">{content}</p>
      </div>
    );
  }
};

