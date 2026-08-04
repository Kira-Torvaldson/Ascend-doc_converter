/**
 * Textarea avec gouttière de numéros de ligne.
 */

import React, { useMemo, useRef } from 'react';

interface EditorWithLinesProps {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement> | null;
  style?: React.CSSProperties;
}

export const EditorWithLines: React.FC<EditorWithLinesProps> = ({
  value,
  onChange,
  className = '',
  readOnly,
  placeholder,
  textAreaRef,
  style,
}) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const lineCount = useMemo(() => Math.max(1, value.split('\n').length), [value]);

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
    <div className="editor-with-lines">
      <div className="editor-line-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="editor-line-number">
            {i + 1}
          </div>
        ))}
      </div>
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
};
