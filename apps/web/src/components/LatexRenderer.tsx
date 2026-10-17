'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

export interface LatexRendererProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
  asBlock?: boolean;
}

/**
 * Sanitizes and normalizes a LaTeX string:
 * - Trims whitespace
 * - Strips enclosing delimiters like \( ... \), \[ ... \], or $$ ... $$
 * - Normalizes double-escaped command backslashes (e.g. \\frac -> \frac)
 */
export function sanitizeLatexFormula(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // Strip enclosing math delimiters
  if (cleaned.startsWith('\\(') && cleaned.endsWith('\\)')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$') && cleaned.endsWith('$') && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Normalize double-escaped LaTeX commands (e.g. \\frac -> \frac, \\sum -> \sum)
  // while preserving literal double backslashes used for newlines inside matrices (\\\\ -> \\)
  cleaned = cleaned.replace(/\\\\([a-zA-Z]+)/g, (_match, cmd) => `\\${cmd}`);

  return cleaned;
}

/**
 * Renders a single LaTeX formula to an HTML string using KaTeX.
 */
export function renderLatexToHtml(formula: string, displayMode = false): string {
  const sanitized = sanitizeLatexFormula(formula);
  if (!sanitized) return '';

  try {
    return katex.renderToString(sanitized, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch (err) {
    console.warn('[LatexRenderer] Failed to render LaTeX formula:', formula, err);
    return `<span class="katex-fallback font-serif italic">${sanitized}</span>`;
  }
}

/**
 * Modern React component for rendering mathematical equations with KaTeX.
 */
export function LatexRenderer({
  formula,
  displayMode = false,
  className = '',
  asBlock = false,
}: LatexRendererProps) {
  const html = useMemo(
    () => renderLatexToHtml(formula, displayMode || asBlock),
    [formula, displayMode, asBlock]
  );

  if (asBlock || displayMode) {
    return (
      <div
        className={`katex-block-wrapper my-2 overflow-x-auto text-center ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`katex-inline-wrapper inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Parses mixed text containing inline LaTeX math delimiters ($...$ or \(...\))
 * and renders both text and math segments seamlessly.
 */
export function LatexText({ text, className = '' }: { text: string; className?: string }) {
  const segments = useMemo(() => {
    if (!text) return [];

    // Regex to match \( ... \), \[ ... \], $$ ... $$, or $ ... $
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\)|\$.*?\$)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isBlockMath =
        (part.startsWith('$$') && part.endsWith('$$')) ||
        (part.startsWith('\\[') && part.endsWith('\\]'));
      const isInlineMath =
        (part.startsWith('$') && part.endsWith('$')) ||
        (part.startsWith('\\(') && part.endsWith('\\)'));

      if (isBlockMath) {
        return (
          <LatexRenderer
            key={index}
            formula={part}
            displayMode={true}
            asBlock={true}
          />
        );
      }
      if (isInlineMath) {
        return (
          <LatexRenderer
            key={index}
            formula={part}
            displayMode={false}
          />
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  }, [text]);

  return <span className={className}>{segments}</span>;
}

export default LatexRenderer;
