/**
 * Affiche caractères / mots / lignes pour un panneau éditeur.
 */

import React from 'react';
import { getTextStats } from '../utils/textStats';

interface TextStatsProps {
  text: string;
}

export const TextStats: React.FC<TextStatsProps> = ({ text }) => {
  const stats = getTextStats(text);
  return (
    <div className="text-stats">
      <span data-tooltip="Nombre de caractères">
        {stats.characterCount.toLocaleString('fr-FR')} caractères
      </span>
      <span data-tooltip="Nombre de mots">
        {stats.wordCount.toLocaleString('fr-FR')} mots
      </span>
      <span data-tooltip="Nombre de lignes">
        {stats.lineCount.toLocaleString('fr-FR')} lignes
      </span>
    </div>
  );
};
