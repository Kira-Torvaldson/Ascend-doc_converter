/**
 * Textarea avec gouttière de numéros de ligne (rendu léger).
 * Optionnellement une couche de coloration markup sous le texte.
 *
 * Seuils progressifs (pas de CodeMirror pour l’instant) :
 * - highlight off dès ~80 Ko / 2,5k lignes
 * - gouttière compacte dès ~100 Ko / 3,5k lignes
 * Scroll sync via rAF pour limiter le travail pendant le défilement.
 */

import React, { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import {
  highlightMarkup,
  inferHighlightLanguage,
  type HighlightLanguage,
} from '../utils/highlightMarkup';

/** Highlight regex trop coûteux au-delà. */
const HIGHLIGHT_MAX_CHARS = 80_000;
const HIGHLIGHT_MAX_LINES = 2_500;
/** Gouttière O(n) trop lourde au-delà. */
const GUTTER_FULL_MAX_CHARS = 100_000;
const GUTTER_FULL_MAX_LINES = 3_500;

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
  /** Après sync gouttière/highlight (rAF). */
  onTextAreaScroll?: (textarea: HTMLTextAreaElement) => void;
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
  onTextAreaScroll,
}) {
  const t = useT();
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLPreElement | null>(null);
  const highlightRef = useRef<HTMLPreElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const onScrollCbRef = useRef(onTextAreaScroll);
  onScrollCbRef.current = onTextAreaScroll;
  const [syntaxPrefOn, setSyntaxPrefOn] = useState(readSyntaxEnabled);
  /** La gouttière / highlight peuvent suivre avec un léger retard pour ne pas bloquer la frappe. */
  const deferredValue = useDeferredValue(value);
  const lineCount = useMemo(() => countLines(deferredValue), [deferredValue]);
  const skipHighlight =
    deferredValue.length >= HIGHLIGHT_MAX_CHARS || lineCount >= HIGHLIGHT_MAX_LINES;
  const skipFullGutter =
    deferredValue.length >= GUTTER_FULL_MAX_CHARS || lineCount >= GUTTER_FULL_MAX_LINES;
  const isLargeDoc = skipFullGutter;
  /** Afficher le badge dès qu’une optimisation perf coupe une couche. */
  const showLiteBadge = skipFullGutter || (skipHighlight && syntaxPrefOn);
  const syntaxOn = syntaxPrefOn && !skipHighlight;
  const showGutter = !skipFullGutter;
  const gutterText = useMemo(
    () => (showGutter ? buildLineNumbers(lineCount) : ''),
    [showGutter, lineCount]
  );
  const gutterCh = showGutter ? String(lineCount).length + 1 : 3;
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
    const sync = () => setSyntaxPrefOn(readSyntaxEnabled());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-syntax-highlight'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const setRefs = (node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    if (textAreaRef && 'current' in textAreaRef) {
      (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }
  };

  const syncScroll = () => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const ta = localRef.current;
      if (!ta) return;
      if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
      if (highlightRef.current) {
        highlightRef.current.scrollTop = ta.scrollTop;
        highlightRef.current.scrollLeft = ta.scrollLeft;
      }
      onScrollCbRef.current?.(ta);
    });
  };

  return (
    <div
      className={`editor-with-lines${syntaxOn ? ' editor-with-lines--syntax' : ''}${isLargeDoc ? ' editor-with-lines--large' : ''}${showLiteBadge ? ' editor-with-lines--lite' : ''}`}
      style={{ ['--editor-gutter-ch' as string]: gutterCh } as React.CSSProperties}
      data-large-doc={isLargeDoc ? 'true' : undefined}
      data-lite-mode={showLiteBadge ? 'true' : undefined}
    >
      {showLiteBadge ? (
        <span
          className="editor-lite-badge"
          title={t('iface.liteMode.hint')}
          data-tooltip={t('iface.liteMode.hint')}
        >
          {t('iface.liteMode')}
        </span>
      ) : null}
      {showGutter ? (
        <pre className="editor-line-gutter" ref={gutterRef} aria-hidden="true">
          {gutterText}
        </pre>
      ) : (
        <div className="editor-line-gutter editor-line-gutter--compact" aria-hidden="true">
          {lineCount}
        </div>
      )}
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
