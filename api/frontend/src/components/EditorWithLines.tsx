/**
 * Textarea avec gouttière de numéros de ligne (rendu léger).
 * Optionnellement une couche de coloration markup sous le texte.
 */

import React, { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  highlightMarkup,
  inferHighlightLanguage,
  type HighlightLanguage,
} from '../utils/highlightMarkup';

interface EditorWithLinesProps {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement | null> | null;
  style?: React.CSSProperties;
  /** Format source/cible pour adapter la coloration. */
  highlightFormat?: string | null;
}

function countLines(text: string): number {
  if (!text) return 1;
  let n = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) n++;
  }
  return n;
}

function buildLineNumbers(count: number): string {
  const parts = new Array<number>(count);
  for (let i = 0; i < count; i++) parts[i] = i + 1;
  return parts.join('\n');
}

function readSyntaxEnabled(): boolean {
  return document.documentElement.getAttribute('data-syntax-highlight') === 'true';
}

export const EditorWithLines: React.FC<EditorWithLinesProps> = memo(function EditorWithLines({
  value,
  onChange,
  className = '',
  readOnly,
  placeholder,
  textAreaRef,
  style,
  highlightFormat,
}) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLPreElement | null>(null);
  const highlightRef = useRef<HTMLPreElement | null>(null);
  const [syntaxOn, setSyntaxOn] = useState(readSyntaxEnabled);
  /** La gouttière / highlight peuvent suivre avec un léger retard pour ne pas bloquer la frappe. */
  const deferredValue = useDeferredValue(value);
  const lineCount = useMemo(() => countLines(deferredValue), [deferredValue]);
  const gutterText = useMemo(() => buildLineNumbers(lineCount), [lineCount]);
  const gutterCh = String(lineCount).length + 1;
  const language: HighlightLanguage = useMemo(
    () => inferHighlightLanguage(highlightFormat),
    [highlightFormat]
  );
  const highlightedHtml = useMemo(() => {
    if (!syntaxOn) return '';
    return highlightMarkup(deferredValue, language);
  }, [syntaxOn, deferredValue, language]);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setSyntaxOn(readSyntaxEnabled());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-syntax-highlight'] });
    return () => observer.disconnect();
  }, []);

  const setRefs = (node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    if (textAreaRef && 'current' in textAreaRef) {
      (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }
  };

  const syncScroll = () => {
    const ta = localRef.current;
    if (!ta) return;
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
  };

  return (
    <div
      className={`editor-with-lines${syntaxOn ? ' editor-with-lines--syntax' : ''}`}
      style={{ ['--editor-gutter-ch' as string]: gutterCh } as React.CSSProperties}
    >
      <pre className="editor-line-gutter" ref={gutterRef} aria-hidden="true">
        {gutterText}
      </pre>
      <div className="editor-code-stack">
        {syntaxOn ? (
          <pre
            className="editor-syntax-layer"
            ref={highlightRef}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : null}
        <textarea
          ref={setRefs}
          className={className}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          style={style}
          onScroll={syncScroll}
          spellCheck={false}
        />
      </div>
    </div>
  );
});
