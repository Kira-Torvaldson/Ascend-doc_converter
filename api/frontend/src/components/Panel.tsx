/**
 * ============================================================================
 * COMPONENT: Panel - Panneau générique pour afficher du contenu
 * ============================================================================
 */

import React, { RefObject } from 'react';
import { FormatType } from '../types';
import { getFormatTitle, getFormatPlaceholder } from '../utils/formatHelpers';

interface PanelProps {
  title: string;
  format: FormatType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  textAreaRef?: RefObject<HTMLTextAreaElement>;
  onCopy?: () => void;
  onClear?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  copied?: boolean;
  isEditing?: boolean;
  loading?: boolean;
  showEditButton?: boolean;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  format,
  value,
  onChange,
  placeholder,
  readOnly = false,
  textAreaRef,
  onCopy,
  onClear,
  onEdit,
  onSave,
  onCancel,
  copied = false,
  isEditing = false,
  loading = false,
  showEditButton = false
}) => {
  const displayPlaceholder = placeholder || getFormatPlaceholder(format);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <span className="format-badge">{getFormatTitle(format)}</span>
      </div>
      <div className="panel-toolbar">
        {onCopy && (
          <button
            onClick={onCopy}
            className="toolbar-button"
            title="Copier"
            disabled={loading || !value.trim()}
          >
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>
        )}
        {showEditButton && !isEditing && onEdit && (
          <button
            onClick={onEdit}
            className="toolbar-button"
            title="Modifier"
            disabled={loading || !value.trim()}
          >
            ✏️ Modifier
          </button>
        )}
        {isEditing && onSave && (
          <button
            onClick={onSave}
            className="toolbar-button save-button"
            title="Enregistrer"
            disabled={loading}
          >
            💾 Enregistrer
          </button>
        )}
        {isEditing && onCancel && (
          <button
            onClick={onCancel}
            className="toolbar-button cancel-button"
            title="Annuler"
            disabled={loading}
          >
            ❌ Annuler
          </button>
        )}
        {onClear && (
          <button
            onClick={onClear}
            className="toolbar-button clear-button"
            title="Effacer"
            disabled={loading || !value.trim()}
          >
            🗑️ Effacer
          </button>
        )}
      </div>
      <textarea
        ref={textAreaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        readOnly={readOnly || (!isEditing && value.trim().length > 0)}
        className="panel-textarea"
        style={{
          cursor: readOnly || (!isEditing && value.trim().length > 0) ? 'default' : 'text'
        }}
      />
    </div>
  );
};
