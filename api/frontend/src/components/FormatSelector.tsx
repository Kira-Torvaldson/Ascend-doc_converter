/**
 * ============================================================================
 * COMPONENT: FormatSelector - Sélecteur de format
 * ============================================================================
 */

import React from 'react';
import { FormatType } from '../types';
import { getFormatTitle } from '../utils/formatHelpers';

interface FormatSelectorProps {
  label: string;
  value: FormatType;
  onChange: (format: FormatType) => void;
  formats: FormatType[];
  disabled?: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  label,
  value,
  onChange,
  formats,
  disabled = false
}) => {
  return (
    <div className="format-selector">
      <label className="format-selector-label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FormatType)}
        disabled={disabled}
        className="format-select"
      >
        {formats.map((format) => (
          <option key={format} value={format}>
            {getFormatTitle(format)}
          </option>
        ))}
      </select>
    </div>
  );
};
