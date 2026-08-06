/**
 * Affiche caractères / mots / lignes pour un panneau éditeur.
 */

import React, { useDeferredValue, useMemo } from 'react';
import { useLocale, useT } from '../i18n/LocaleContext';
import { getTextStats } from '../utils/textStats';

const LOCALE_TAGS: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
};

interface TextStatsProps {
  text: string;
}

export const TextStats: React.FC<TextStatsProps> = ({ text }) => {
  const t = useT();
  const { locale } = useLocale();
  const deferred = useDeferredValue(text);
  const stats = useMemo(() => getTextStats(deferred), [deferred]);
  const tag = LOCALE_TAGS[locale] || 'fr-FR';
  return (
    <div className="text-stats">
      <span data-tooltip={t('stats.chars.tip')}>
        {stats.characterCount.toLocaleString(tag)} {t('stats.chars')}
      </span>
      <span data-tooltip={t('stats.words.tip')}>
        {stats.wordCount.toLocaleString(tag)} {t('stats.words')}
      </span>
      <span data-tooltip={t('stats.lines.tip')}>
        {stats.lineCount.toLocaleString(tag)} {t('stats.lines')}
      </span>
    </div>
  );
};
