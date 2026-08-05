/**
 * Textarea avec gouttière de numéros de ligne (rendu léger).
 */

import React, { memo, useDeferredValue, useMemo, useRef } from 'react';

interface EditorWithLinesProps {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement | null> | null;
  style?: React.CSSProperties;
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

export const EditorWithLines: React.FC<EditorWithLinesProps> = memo(function EditorWithLines({
  value,
  onChange,
  className = '',
  readOnly,
  placeholder,
  textAreaRef,
  style,
}) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLPreElement | null>(null);
  /** La gouttière peut suivre avec un léger retard pour ne pas bloquer la frappe. */
  const deferredValue = useDeferredValue(value);
  const lineCount = useMemo(() => countLines(deferredValue), [deferredValue]);
  const gutterText = useMemo(() => buildLineNumbers(lineCount), [lineCount]);
  const gutterCh = String(lineCount).length + 1;

  const setRefs = (node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    if (textAreaRef && 'current' in textAreaRef) {
      (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }
  };

  const syncScroll = () => {
    if (localRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = localRef.current.scrollTop;
    }
  };

  return (
    <div
      className="editor-with-lines"
      style={{ ['--editor-gutter-ch' as string]: gutterCh } as React.CSSProperties}
    >
      <pre className="editor-line-gutter" ref={gutterRef} aria-hidden="true">
        {gutterText}
      </pre>
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
  );
});
