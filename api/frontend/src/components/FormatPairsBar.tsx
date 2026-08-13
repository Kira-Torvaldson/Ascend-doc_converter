/**
 * Raccourcis de paires source → destination (favoris + récents).
 * UI volontairement minimale : une ligne de liens + pin de la paire courante.
 */

import React, { useMemo } from 'react';
import type { FormatType } from '../types';
import { useT } from '../i18n/LocaleContext';
import {
  formatPairShortLabel,
  isFavoritePair,
  isSupportedUiConversion,
  MAX_FORMAT_PAIRS,
  pairKey,
  type FormatPair,
} from '../utils/conversionPairs';

interface FormatPairsBarProps {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  recentPairs: FormatPair[];
  favoritePairs: FormatPair[];
  onApplyPair: (source: FormatType, target: FormatType) => void;
  onToggleFavorite: (source: FormatType, target: FormatType) => void;
  applyDisabled?: boolean;
}

export const FormatPairsBar: React.FC<FormatPairsBarProps> = ({
  sourceFormat,
  targetFormat,
  recentPairs,
  favoritePairs,
  onApplyPair,
  onToggleFavorite,
  applyDisabled = false,
}) => {
  const t = useT();
  const currentSupported = isSupportedUiConversion(sourceFormat, targetFormat);
  const currentFavorite = isFavoritePair(favoritePairs, sourceFormat, targetFormat);
  const favoritesFull = favoritePairs.length >= MAX_FORMAT_PAIRS && !currentFavorite;

  const shortcuts = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<FormatPair & { favorite: boolean }> = [];
    for (const p of favoritePairs) {
      const key = pairKey(p);
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ ...p, favorite: true });
    }
    for (const p of recentPairs) {
      const key = pairKey(p);
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ ...p, favorite: false });
    }
    return list;
  }, [favoritePairs, recentPairs]);

  if (!currentSupported && shortcuts.length === 0) return null;

  const pinTip = currentFavorite
    ? t('sidebar.pairs.favoriteRemove')
    : favoritesFull
      ? t('sidebar.pairs.favoritesFull', { max: MAX_FORMAT_PAIRS })
      : t('sidebar.pairs.favoriteAdd');

  return (
    <div className="format-pairs" role="region" aria-label={t('sidebar.pairs.title')}>
      {currentSupported ? (
        <button
          type="button"
          className={`format-pairs-pin${currentFavorite ? ' is-active' : ''}`}
          onClick={() => {
            if (favoritesFull) return;
            onToggleFavorite(sourceFormat, targetFormat);
          }}
          disabled={favoritesFull}
          aria-pressed={currentFavorite}
          data-tooltip={pinTip}
          aria-label={pinTip}
        >
          <span aria-hidden="true">{currentFavorite ? '★' : '☆'}</span>
          <span>{currentFavorite ? t('sidebar.pairs.pinned') : t('sidebar.pairs.pin')}</span>
        </button>
      ) : null}

      {shortcuts.length > 0 ? (
        <div className="format-pairs-list">
          {shortcuts.map((pair) => {
            const active = pair.source === sourceFormat && pair.target === targetFormat;
            const label = formatPairShortLabel(pair);
            return (
              <button
                key={pairKey(pair)}
                type="button"
                className={`format-pairs-link${active ? ' is-active' : ''}${pair.favorite ? ' is-favorite' : ''}`}
                onClick={() => {
                  if (applyDisabled) return;
                  onApplyPair(pair.source, pair.target);
                }}
                disabled={applyDisabled}
                data-tooltip={t('sidebar.pairs.apply', { pair: label })}
                aria-label={t('sidebar.pairs.apply', { pair: label })}
                aria-pressed={active}
              >
                {pair.favorite ? (
                  <span className="format-pairs-link-mark" aria-hidden="true">
                    ★
                  </span>
                ) : null}
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
