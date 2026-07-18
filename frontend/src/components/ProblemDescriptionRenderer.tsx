import React from "react";

interface ProblemDescriptionRendererProps {
  content?: string;
  className?: string;
}

/**
 * ProblemDescriptionRenderer parses Markdown headings (#, ##, ###),
 * custom bounding syntax (##text##, ###text###), bold (**bold** or __bold__),
 * inline code (`code`), lists (- item, * item, 1. item), code blocks (```code```),
 * and paragraph breaks into beautiful, highly readable components.
 */
export const ProblemDescriptionRenderer: React.FC<ProblemDescriptionRendererProps> = ({
  content = "",
  className = "",
}) => {
  if (!content) {
    return <div className={`text-xs font-mono text-slate-400 italic ${className}`}>No problem description provided.</div>;
  }

  // 1. Parse inline formatting helpers (bold, italic, inline code, inline ##text##)
  const renderInline = (text: string): React.ReactNode[] => {
    // We tokenize using regex that captures:
    // - Inline code: `([^`]+)`
    // - Bold: \*\*([^*]+)\*\* or __([^_]+)__
    // - Inline/bounding ##text## when not on a single line by itself: ##([^#\n]+)##
    // - Italic: \*([^*]+)\* or _([^_]+)_
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|##[^#\n]+##|\*[^*]+\*|_[^_]+_)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Inline code
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={index}
            className="bg-ivory-200/80 px-1.5 py-0.5 rounded font-mono text-xs text-amber-950 border border-slate-900/10 mx-0.5 shadow-2xs select-all"
          >
            {codeText}
          </code>
        );
      }

      // Bold (**bold** or __bold__)
      if (
        (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
        (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
      ) {
        const boldText = part.slice(2, -2);
        return (
          <strong
            key={index}
            className="font-bold text-slate-900 bg-amber-500/10 px-1 rounded-sm border border-amber-500/15 font-sans"
          >
            {boldText}
          </strong>
        );
      }

      // Inline ##text## marker (converts into bold prominent badge or heading style)
      if (part.startsWith("##") && part.endsWith("##") && part.length >= 4) {
        const innerText = part.slice(2, -2).trim();
        return (
          <strong
            key={index}
            className="font-bold font-serif text-slate-950 bg-amber-500/20 px-1.5 py-0.5 rounded border-l-2 border-amber-600 text-xs sm:text-sm my-0.5 inline-block shadow-2xs"
          >
            {innerText}
          </strong>
        );
      }

      // Italic (*italic* or _italic_)
      if (
        (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
        (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
      ) {
        const italicText = part.slice(1, -1);
        return (
          <em key={index} className="italic text-slate-800 font-sans">
            {italicText}
          </em>
        );
      }

      // Regular text
      return <span key={index}>{part}</span>;
    });
  };

  // 2. Separate code blocks from regular block content
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const rawSegments = content.split(codeBlockRegex);

  const renderedBlocks: React.ReactNode[] = [];

  rawSegments.forEach((segment, segmentIndex) => {
    // Even indices are normal markdown paragraphs/lines; odd indices are contents of ```code blocks```
    if (segmentIndex % 2 === 1) {
      // Code block
      const lines = segment.trim().split("\n");
      const firstLine = lines[0]?.trim();
      const isLanguageSpec = /^[a-zA-Z0-9_-]+$/.test(firstLine || "");
      const lang = isLanguageSpec ? firstLine : "";
      const codeContent = isLanguageSpec ? lines.slice(1).join("\n") : segment.trim();

      renderedBlocks.push(
        <div key={`codeblock-${segmentIndex}`} className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-md">
          {lang && (
            <div className="bg-slate-800/80 px-3.5 py-1.5 border-b border-slate-700/60 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 tracking-wider">
                {lang}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Code Snippet</span>
            </div>
          )}
          <pre className="p-3.5 text-ivory-100 font-mono text-xs sm:text-xs leading-relaxed overflow-x-auto select-all">
            {codeContent}
          </pre>
        </div>
      );
      return;
    }

    // Normal blocks split by double newline (\n\n) or single line blocks if they are headings/lists
    const paragraphs = segment.split(/\n\s*\n/);

    paragraphs.forEach((paragraph, pIndex) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return;

      const lines = trimmed.split("\n");

      // Check if this entire block is a list (all lines start with - , * , or digits like 1. )
      const isUnorderedList = lines.every((l) => /^\s*[-*]\s+/.test(l));
      const isOrderedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));

      if (isUnorderedList) {
        renderedBlocks.push(
          <ul key={`ul-${segmentIndex}-${pIndex}`} className="my-2.5 space-y-1.5 pl-2">
            {lines.map((line, lIdx) => {
              const itemText = line.replace(/^\s*[-*]\s+/, "");
              return (
                <li key={lIdx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  <span className="text-amber-600 font-bold mt-0.5 select-none shrink-0">•</span>
                  <div className="flex-1">{renderInline(itemText)}</div>
                </li>
              );
            })}
          </ul>
        );
        return;
      }

      if (isOrderedList) {
        renderedBlocks.push(
          <ol key={`ol-${segmentIndex}-${pIndex}`} className="my-2.5 space-y-1.5 pl-2">
            {lines.map((line, lIdx) => {
              const match = line.match(/^\s*(\d+)\.\s+(.*)/);
              const num = match ? match[1] : `${lIdx + 1}`;
              const itemText = match ? match[2] : line;
              return (
                <li key={lIdx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  <span className="font-mono font-bold text-slate-600 min-w-[1.25rem] select-none shrink-0">{num}.</span>
                  <div className="flex-1">{renderInline(itemText)}</div>
                </li>
              );
            })}
          </ol>
        );
        return;
      }

      // Check each line inside paragraph for Headings (#, ##, ### or ##text## on standalone line)
      // If lines mix headings and regular text, process them line by line
      const lineNodes = lines.map((line, lIdx) => {
        const cleanLine = line.trim();

        // Standalone ##text## or ###text### heading check
        const enclosedHeadingMatch = cleanLine.match(/^(#{1,4})\s*(.+?)\s*\1$/);
        if (enclosedHeadingMatch) {
          const level = enclosedHeadingMatch[1].length;
          const headingText = enclosedHeadingMatch[2];
          if (level === 1) {
            return (
              <h1 key={lIdx} className="text-lg sm:text-xl font-serif font-bold text-slate-900 mt-4 mb-2 border-b border-slate-900/15 pb-1">
                {renderInline(headingText)}
              </h1>
            );
          } else if (level === 2) {
            return (
              <h2 key={lIdx} className="text-base sm:text-lg font-serif font-bold text-slate-900 mt-3.5 mb-1.5 text-amber-950 border-l-2 border-amber-500 pl-2.5 py-0.5">
                {renderInline(headingText)}
              </h2>
            );
          } else {
            return (
              <h3 key={lIdx} className="text-sm sm:text-base font-serif font-bold text-slate-900 mt-3 mb-1 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                <span>{renderInline(headingText)}</span>
              </h3>
            );
          }
        }

        // Standard Markdown Prefix Headings (# , ## , ### )
        const prefixHeadingMatch = cleanLine.match(/^(#{1,4})\s+(.+)$/);
        if (prefixHeadingMatch) {
          const level = prefixHeadingMatch[1].length;
          const headingText = prefixHeadingMatch[2];
          if (level === 1) {
            return (
              <h1 key={lIdx} className="text-lg sm:text-xl font-serif font-bold text-slate-900 mt-4 mb-2 border-b border-slate-900/15 pb-1">
                {renderInline(headingText)}
              </h1>
            );
          } else if (level === 2) {
            return (
              <h2 key={lIdx} className="text-base sm:text-lg font-serif font-bold text-slate-900 mt-3.5 mb-1.5 text-amber-950 border-l-2 border-amber-500 pl-2.5 py-0.5">
                {renderInline(headingText)}
              </h2>
            );
          } else {
            return (
              <h3 key={lIdx} className="text-sm sm:text-base font-serif font-bold text-slate-900 mt-3 mb-1 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                <span>{renderInline(headingText)}</span>
              </h3>
            );
          }
        }

        // Standard line with inline formatting
        return (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInline(line)}
          </React.Fragment>
        );
      });

      renderedBlocks.push(
        <div key={`p-${segmentIndex}-${pIndex}`} className="my-2.5 text-xs sm:text-sm text-slate-700 font-sans leading-relaxed tracking-tight">
          {lineNodes}
        </div>
      );
    });
  });

  return <div className={`space-y-2 font-sans ${className}`}>{renderedBlocks}</div>;
};
