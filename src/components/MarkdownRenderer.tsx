import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * High-performance, robust Markdown Renderer for FMGE AI Coach.
 * Accurately parses headings, bullet lists, numbered lists, tables, callouts, and paragraphs line-by-line.
 * Uses bulletproof loop advancement to strictly prevent any infinite rendering freeze on streaming or malformed AI output.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

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
        tokens.push(text.substring(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        tokens.push(
          <strong key={`b-${keyIdx++}`} className="font-bold text-slate-900">
            {match[2]}
          </strong>
        );
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
      tokens.push(text.substring(lastIndex));
    }

    return tokens.length > 0 ? tokens : [text];
  };

  // Split content into lines and group into structured blocks
  const rawLines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

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
          <div key={`table-${blocks.length}`} className="w-full overflow-x-auto my-3 rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider font-['Outfit']">
                <tr>
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx} className="py-2.5 px-3.5 border-r border-slate-200 last:border-r-0">{formatInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rowLines.map((rowLine, rIdx) => {
                  const cells = rowLine.split('|').slice(1, -1).map(c => c.trim());
                  return (
                    <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3.5 text-slate-700 leading-relaxed border-r border-slate-100 last:border-r-0">
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
        // Single partial table line (e.g. streaming in progress)
        blocks.push(
          <p key={`table-single-${blocks.length}`} className="w-full text-sm font-mono text-slate-700 my-1 break-words">
            {formatInline(tableLines[0])}
          </p>
        );
      }
      continue;
    }

    // 2. Headings (#, ##, ###, ####, #####, ###### with space)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];

      if (level === 1) {
        blocks.push(
          <h1 key={`h1-${blocks.length}`} className="w-full text-xl font-bold font-['Outfit'] text-slate-900 mt-5 mb-2.5 border-b border-slate-200 pb-2">
            {formatInline(headingText)}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={`h2-${blocks.length}`} className="w-full text-lg font-bold font-['Outfit'] text-slate-900 mt-5 mb-2 border-b border-slate-100 pb-1.5">
            {formatInline(headingText)}
          </h2>
        );
      } else if (level === 3) {
        blocks.push(
          <h3 key={`h3-${blocks.length}`} className="w-full text-base font-bold font-['Outfit'] text-slate-900 mt-4 mb-1.5">
            {formatInline(headingText)}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={`h4-${blocks.length}`} className="w-full text-sm font-bold font-['Outfit'] text-slate-900 mt-3 mb-1">
            {formatInline(headingText)}
          </h4>
        );
      }
      i++;
      continue;
    }

    // 3. High-Yield Callout / Alert Box (💡, ⚠️, 🧠, 🎯, >)
    if (/^[💡⚠️🧠🎯]/.test(trimmed) || trimmed.startsWith('>')) {
      const calloutLines: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim() &&
        (/^[💡⚠️🧠🎯]/.test(rawLines[i].trim()) ||
          rawLines[i].trim().startsWith('>') ||
          (calloutLines.length > 0 &&
            !rawLines[i].trim().startsWith('#') &&
            !rawLines[i].trim().startsWith('- ') &&
            !rawLines[i].trim().startsWith('* ') &&
            !rawLines[i].trim().startsWith('|') &&
            !/^\d+\.\s/.test(rawLines[i].trim())))
      ) {
        calloutLines.push(rawLines[i].trim().replace(/^>\s*/, ''));
        i++;
      }

      if (calloutLines.length > 0) {
        const fullCalloutText = calloutLines.join(' ');
        let bg = 'bg-sky-50/90 border-sky-200 text-sky-950';
        if (fullCalloutText.includes('⚠️')) bg = 'bg-amber-50/90 border-amber-200 text-amber-950';
        if (fullCalloutText.includes('🧠')) bg = 'bg-purple-50/90 border-purple-200 text-purple-950';
        if (fullCalloutText.includes('🎯')) bg = 'bg-emerald-50/90 border-emerald-200 text-emerald-950';

        blocks.push(
          <div key={`callout-${blocks.length}`} className={`w-full my-3 p-4 rounded-2xl border ${bg} text-sm leading-relaxed shadow-2xs break-words`}>
            {formatInline(fullCalloutText)}
          </div>
        );
      }
      continue;
    }

    // 4. Bullet Lists (- , * , • , + )
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
        <ul key={`ul-${blocks.length}`} className="w-full space-y-1.5 my-2 pl-4 list-disc text-slate-800 text-sm leading-relaxed marker:text-slate-400">
          {listItems.map((itemText, lIdx) => (
            <li key={lIdx} className="pl-1 break-words">
              {formatInline(itemText)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Numbered Lists (1. , 2. )
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }

      blocks.push(
        <ol key={`ol-${blocks.length}`} className="w-full space-y-1.5 my-2 pl-4 list-decimal text-slate-800 text-sm leading-relaxed marker:font-bold marker:text-slate-500 font-['Outfit']">
          {listItems.map((itemText, lIdx) => (
            <li key={lIdx} className="pl-1 break-words">
              <span className="font-normal font-['Plus_Jakarta_Sans']">{formatInline(itemText)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 6. Regular Paragraph
    const paraLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith('#') &&
      !rawLines[i].trim().startsWith('|') &&
      !rawLines[i].trim().startsWith('- ') &&
      !rawLines[i].trim().startsWith('* ') &&
      !rawLines[i].trim().startsWith('• ') &&
      !rawLines[i].trim().startsWith('+ ') &&
      !/^\d+\.\s/.test(rawLines[i].trim()) &&
      !/^[💡⚠️🧠🎯]/.test(rawLines[i].trim()) &&
      !rawLines[i].trim().startsWith('>') &&
      !/^(?:---|\*\*\*|___)\s*$/.test(rawLines[i].trim())
    ) {
      paraLines.push(rawLines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="w-full text-sm sm:text-base text-slate-800 leading-relaxed my-1.5 break-words">
          {formatInline(paraLines.join(' '))}
        </p>
      );
    }

    // 7. Critical Safeguard: If no block consumed the line, advance i unconditionally
    if (i === startIndex) {
      const fallbackText = rawLines[i].trim();
      if (fallbackText) {
        blocks.push(
          <p key={`p-fallback-${blocks.length}`} className="w-full text-sm sm:text-base text-slate-800 leading-relaxed my-1.5 break-words">
            {formatInline(fallbackText)}
          </p>
        );
      }
      i++;
    }
  }

  return (
    <div className={`w-full max-w-none text-slate-800 space-y-2.5 font-['Plus_Jakarta_Sans'] ${className}`}>
      {blocks}
    </div>
  );
};
