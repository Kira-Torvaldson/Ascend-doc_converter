/**
 * Barre Recherche / Remplacer (Ctrl+F).
 */

import React, { useEffect, useRef, useState } from 'react';

interface FindReplaceBarProps {
  open: boolean;
  onClose: () => void;
  haystack: string;
  onReplaceInTarget: (next: string) => void;
  readOnly?: boolean;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  open,
  onClose,
  haystack,
  onReplaceInTarget,
  readOnly = false,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = (() => {
    if (!query) return [] as number[];
    const positions: number[] = [];
    let from = 0;
    const q = query;
    while (from <= haystack.length) {
      const at = haystack.indexOf(q, from);
      if (at < 0) break;
      positions.push(at);
      from = at + Math.max(1, q.length);
    }
    return positions;
  })();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query, haystack]);

  if (!open) return null;

  const go = (delta: number) => {
    if (!matches.length) return;
    setIndex((i) => (i + delta + matches.length) % matches.length);
  };

  const replaceOne = () => {
    if (readOnly || !query || !matches.length) return;
    const at = matches[index] ?? matches[0];
    const next =
      haystack.slice(0, at) + replacement + haystack.slice(at + query.length);
    onReplaceInTarget(next);
  };

  const replaceAll = () => {
    if (readOnly || !query) return;
    onReplaceInTarget(haystack.split(query).join(replacement));
  };

  return (
    <div className="find-replace-bar" role="search">
      <input
        ref={inputRef}
        className="find-replace-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher…"
        aria-label="Rechercher"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Enter') {
            e.preventDefault();
            go(e.shiftKey ? -1 : 1);
          }
        }}
      />
      {!readOnly && (
        <input
          className="find-replace-input"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder="Remplacer par…"
          aria-label="Remplacer par"
        />
      )}
      <span className="find-replace-count">
        {query ? `${matches.length ? index + 1 : 0}/${matches.length}` : '—'}
      </span>
      <button type="button" className="find-replace-btn" onClick={() => go(-1)} disabled={!matches.length}>
        ↑
      </button>
      <button type="button" className="find-replace-btn" onClick={() => go(1)} disabled={!matches.length}>
        ↓
      </button>
      {!readOnly && (
        <>
          <button type="button" className="find-replace-btn" onClick={replaceOne} disabled={!matches.length}>
            Remplacer
          </button>
          <button type="button" className="find-replace-btn" onClick={replaceAll} disabled={!query}>
            Tout
          </button>
        </>
      )}
      <button type="button" className="find-replace-btn find-replace-btn--close" onClick={onClose} aria-label="Fermer">
        ×
      </button>
    </div>
  );
};
