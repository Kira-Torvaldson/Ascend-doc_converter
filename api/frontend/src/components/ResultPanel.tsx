/**
 * Panneau Résultat (sortie de conversion).
 */

import React from 'react';
import { ConversionLoadingBanner } from './ConversionLoadingBanner';
import { EmptyEditorState } from './EmptyEditorState';
import { PanelActionsMenu, type PanelActionItem } from './PanelActionsMenu';
import { TextStats } from './TextStats';
import { EditorWithLines } from './EditorWithLines';

interface ResultPanelProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  sourceHasContent: boolean;
  loading: boolean;
  status: string;
  isEditingResult: boolean;
  resultModified: boolean;
  actions: PanelActionItem[];
  onClear: () => void;
  onMarkModified: () => void;
  viewMode?: 'text' | 'preview';
  onViewModeChange?: (mode: 'text' | 'preview') => void;
  previewHtml?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  title,
  value,
  onChange,
  sourceHasContent,
  loading,
  status,
  isEditingResult,
  resultModified,
  actions,
  onClear,
  onMarkModified,
  viewMode = 'text',
  onViewModeChange,
  previewHtml = '',
}) => {
  const isLocked = !!value && !isEditingResult;
  const isEditing = !!value && isEditingResult;
  const showPreview = viewMode === 'preview' && !isEditingResult;

  return (
    <section
      className={`panel panel--result${isLocked ? ' result-locked' : isEditing ? ' result-editing' : ''}`}
    >
      <div className="panel-header">
        <h2>
          {title}
          {resultModified && (
            <span
              className="panel-modified-badge"
              data-tooltip="Résultat modifié depuis la dernière conversion"
            >
              modifié
            </span>
          )}
        </h2>
        <div className="panel-header-actions">
          {value ? (
            <>
              {onViewModeChange && !isEditingResult && (
                <div className="result-view-toggle" role="group" aria-label="Mode d'affichage">
                  <button
                    type="button"
                    className={`result-view-btn${viewMode === 'text' ? ' is-active' : ''}`}
                    onClick={() => onViewModeChange('text')}
                  >
                    Texte
                  </button>
                  <button
                    type="button"
                    className={`result-view-btn${viewMode === 'preview' ? ' is-active' : ''}`}
                    onClick={() => onViewModeChange('preview')}
                  >
                    Aperçu
                  </button>
                </div>
              )}
              {isLocked && (
                <span
                  className="result-zone-state result-zone-locked"
                  role="status"
                  aria-live="polite"
                  data-tooltip="Lecture seule — activez l'édition pour modifier"
                >
                  Verrouillé
                </span>
              )}
              {isEditing && (
                <span
                  className="result-zone-state result-zone-editing"
                  role="status"
                  aria-live="polite"
                  data-tooltip="Mode édition actif"
                >
                  Édition
                </span>
              )}
              <PanelActionsMenu items={actions} />
              {!isEditingResult && (
                <button
                  type="button"
                  onClick={onClear}
                  className="panel-header-btn panel-header-btn--danger"
                  data-tooltip="Effacer le résultat"
                  aria-label="Effacer le résultat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12zM10 11v6M14 11v6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
      {loading && <ConversionLoadingBanner status={status} />}
      {value ? (
        <div className="panel-toolbar panel-toolbar--end">
          <TextStats text={value} />
        </div>
      ) : null}
      <div className={`editor-shell${!value.trim() && !loading ? ' is-empty' : ''}`}>
        {!value.trim() && !loading && (
          <EmptyEditorState
            variant="result"
            title={`Résultat ${title}`}
            description={
              !sourceHasContent
                ? 'Ajoutez du contenu à gauche, puis cliquez sur Convertir.'
                : 'Prêt — cliquez sur Convertir pour générer le résultat.'
            }
          />
        )}
        {showPreview ? (
          <div
            className="result-preview"
            dangerouslySetInnerHTML={{ __html: previewHtml || '<p><em>Aperçu vide</em></p>' }}
          />
        ) : (
          <EditorWithLines
            className="result-textarea"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (isEditingResult) onMarkModified();
            }}
            readOnly={!isEditingResult}
            placeholder={
              loading
                ? 'Conversion en cours...'
                : !value.trim()
                  ? ''
                  : `Résultat ${title}...`
            }
            style={{
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          />
        )}
      </div>
    </section>
  );
};
