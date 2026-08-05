/**
 * Panneau latéral « Autres options » — menu déroulant + réglages.
 */

import React from 'react';
import { SidebarListbox } from './SidebarListbox';
import { ConversionProfilesSection } from './ConversionProfilesSection';
import type { ConversionOptions, FormatType } from '../types';

export type OtherOptionsCategory = {
  value: string;
  label: string;
};

interface OtherOptionsPanelProps {
  category: string;
  categories: OtherOptionsCategory[];
  onCategoryChange: (value: string) => void;
  conversionOptions: ConversionOptions;
  updateOption: (path: string[], value: unknown) => void;
  targetFormat: FormatType;
  navigationEnabled: boolean;
  onNavigationToggle: (enabled: boolean) => void;
  headingsCount: number;
  activeProfileIds?: string[];
  onToggleProfile?: (profileId: string) => void;
  onClearProfiles?: () => void;
}

export const OtherOptionsPanel: React.FC<OtherOptionsPanelProps> = ({
  category,
  categories,
  onCategoryChange,
  conversionOptions,
  updateOption,
  targetFormat,
  navigationEnabled,
  onNavigationToggle,
  headingsCount,
  activeProfileIds = [],
  onToggleProfile,
  onClearProfiles,
}) => {
  return (
    <>
      {onToggleProfile && (
        <ConversionProfilesSection
          activeProfileIds={activeProfileIds}
          onToggleProfile={onToggleProfile}
          onClearProfiles={onClearProfiles}
        />
      )}

      <div className="sidebar-section">
        <h3 className="sidebar-title">Autres options</h3>

        <div className="sidebar-content other-options-body">
          <div className="other-options-picker">
            <SidebarListbox
              id="other-options-category"
              label="Catégorie"
              value={category}
              options={categories}
              onChange={onCategoryChange}
            />
          </div>

          <div className="other-options-panel other-options-panel--compact">
            <div className="other-options-panel-body" key={category}>
              {category === 'navigation' && (
                <div className="option-stack">
                  <label className="option-checkbox-label">
                    <input
                      type="checkbox"
                      checked={navigationEnabled}
                      onChange={(e) => onNavigationToggle(e.target.checked)}
                      className="option-checkbox"
                    />
                    <span>Activer la navigation</span>
                    {headingsCount > 0 && (
                      <span className="navigation-count">
                        {headingsCount} {headingsCount > 1 ? 'sections' : 'section'}
                      </span>
                    )}
                  </label>
                </div>
              )}

              {category === 'contentAnalysis' && (
                <>
                  <div className="option-panel-block">
                    <div className="option-group">
                      <label className="option-label">Mode d&apos;analyse</label>
                      <select
                        value={conversionOptions.contentAnalysis?.analysisMode || 'heuristic'}
                        onChange={(e) =>
                          updateOption(['contentAnalysis', 'analysisMode'], e.target.value)
                        }
                        className="option-select"
                      >
                        <option value="basic">Basique</option>
                        <option value="heuristic">Heuristique</option>
                        <option value="strict">Strict</option>
                      </select>
                    </div>
                  </div>
                  <div className="option-stack">
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          conversionOptions.contentAnalysis?.headingDetection?.enabled !== false
                        }
                        onChange={(e) =>
                          updateOption(
                            ['contentAnalysis', 'headingDetection', 'enabled'],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Détection des titres</span>
                    </label>
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          conversionOptions.contentAnalysis?.listDetection?.enabled !== false
                        }
                        onChange={(e) =>
                          updateOption(
                            ['contentAnalysis', 'listDetection', 'enabled'],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Détection des listes</span>
                    </label>
                  </div>
                </>
              )}

              {category === 'normalization' && (
                <>
                  <div className="option-panel-block">
                    <div className="option-grid-2">
                      <div className="option-group">
                        <label className="option-label">Encodage</label>
                        <select
                          value={conversionOptions.normalization?.encoding || 'utf-8'}
                          onChange={(e) =>
                            updateOption(['normalization', 'encoding'], e.target.value)
                          }
                          className="option-select"
                        >
                          <option value="utf-8">UTF-8</option>
                          <option value="latin1">Latin1</option>
                          <option value="ascii">ASCII</option>
                        </select>
                      </div>
                      <div className="option-group">
                        <label className="option-label">Unicode</label>
                        <select
                          value={
                            conversionOptions.normalization?.advanced?.unicode?.normalization ||
                            'NFC'
                          }
                          onChange={(e) =>
                            updateOption(
                              ['normalization', 'advanced', 'unicode', 'normalization'],
                              e.target.value
                            )
                          }
                          className="option-select"
                        >
                          <option value="none">Off</option>
                          <option value="NFC">NFC</option>
                          <option value="NFKC">NFKC</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="option-stack">
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={conversionOptions.normalization?.tabs?.convertToSpaces !== false}
                        onChange={(e) =>
                          updateOption(
                            ['normalization', 'tabs', 'convertToSpaces'],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Tabulations → espaces</span>
                    </label>
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          conversionOptions.normalization?.advanced?.unicode
                            ?.detectConfusables !== false
                        }
                        onChange={(e) =>
                          updateOption(
                            ['normalization', 'advanced', 'unicode', 'detectConfusables'],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Caractères confusables</span>
                    </label>
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          conversionOptions.normalization?.advanced?.characterCleaning
                            ?.removeControlChars || false
                        }
                        onChange={(e) =>
                          updateOption(
                            [
                              'normalization',
                              'advanced',
                              'characterCleaning',
                              'removeControlChars',
                            ],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Retirer contrôles</span>
                    </label>
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          conversionOptions.normalization?.advanced?.characterCleaning
                            ?.removeDirectionalChars || false
                        }
                        onChange={(e) =>
                          updateOption(
                            [
                              'normalization',
                              'advanced',
                              'characterCleaning',
                              'removeDirectionalChars',
                            ],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Retirer directionnels</span>
                    </label>
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          conversionOptions.normalization?.advanced?.characterCleaning
                            ?.removeNonPrintableChars || false
                        }
                        onChange={(e) =>
                          updateOption(
                            [
                              'normalization',
                              'advanced',
                              'characterCleaning',
                              'removeNonPrintableChars',
                            ],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Retirer non imprimables</span>
                    </label>
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={
                          conversionOptions.normalization?.advanced?.validation
                            ?.rejectInvalidSequences !== false
                        }
                        onChange={(e) =>
                          updateOption(
                            [
                              'normalization',
                              'advanced',
                              'validation',
                              'rejectInvalidSequences',
                            ],
                            e.target.checked
                          )
                        }
                        className="option-checkbox"
                      />
                      <span>Rejeter séquences invalides</span>
                    </label>
                  </div>
                </>
              )}

              {category === 'rendering' && (
                <div className="option-stack">
                  <label className="option-checkbox-label">
                    <input
                      type="checkbox"
                      checked={conversionOptions.rendering?.tableOfContents?.enabled || false}
                      onChange={(e) =>
                        updateOption(
                          ['rendering', 'tableOfContents', 'enabled'],
                          e.target.checked
                        )
                      }
                      className="option-checkbox"
                    />
                    <span>Table des matières</span>
                  </label>
                  <label className="option-checkbox-label">
                    <input
                      type="checkbox"
                      checked={conversionOptions.rendering?.sectionNumbering?.enabled || false}
                      onChange={(e) =>
                        updateOption(
                          ['rendering', 'sectionNumbering', 'enabled'],
                          e.target.checked
                        )
                      }
                      className="option-checkbox"
                    />
                    <span>Numérotation des sections</span>
                  </label>
                  <div>
                    <label className="option-checkbox-label">
                      <input
                        type="checkbox"
                        checked={conversionOptions.rendering?.lineWrap?.enabled || false}
                        onChange={(e) =>
                          updateOption(['rendering', 'lineWrap', 'enabled'], e.target.checked)
                        }
                        className="option-checkbox"
                      />
                      <span>Retour à la ligne automatique</span>
                    </label>
                    {conversionOptions.rendering?.lineWrap?.enabled && (
                      <input
                        type="number"
                        value={conversionOptions.rendering?.lineWrap?.maxWidth || 80}
                        onChange={(e) =>
                          updateOption(
                            ['rendering', 'lineWrap', 'maxWidth'],
                            parseInt(e.target.value, 10) || 80
                          )
                        }
                        className="option-input option-field-follow"
                        min={40}
                        max={200}
                        placeholder="Largeur max"
                      />
                    )}
                  </div>
                </div>
              )}

              {category === 'formatSpecific' && (
                <>
                  {targetFormat === 'markdown' && (
                    <div className="option-panel-block">
                      <div className="option-group">
                        <label className="option-label">Variante Markdown</label>
                        <select
                          value={
                            conversionOptions.formatSpecific?.markdown?.parsedown
                              ? 'parsedown'
                              : conversionOptions.formatSpecific?.markdown?.flavor ||
                                'commonmark'
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'parsedown') {
                              updateOption(['formatSpecific', 'markdown', 'parsedown'], true);
                              updateOption(
                                ['formatSpecific', 'markdown', 'flavor'],
                                'commonmark'
                              );
                            } else {
                              updateOption(['formatSpecific', 'markdown', 'parsedown'], false);
                              updateOption(['formatSpecific', 'markdown', 'flavor'], value);
                            }
                          }}
                          className="option-select"
                        >
                          <option value="commonmark">CommonMark</option>
                          <option value="gfm">GitHub Flavored</option>
                          <option value="markdown">Markdown</option>
                          <option value="parsedown">Parsedown (BookStack)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {targetFormat === 'asciidoc' && (
                    <div className="option-panel-block">
                      <div className="option-group">
                        <label className="option-label">Mode de compatibilité</label>
                        <select
                          value={
                            conversionOptions.formatSpecific?.asciidoc?.compatMode ||
                            'asciidoctor'
                          }
                          onChange={(e) =>
                            updateOption(
                              ['formatSpecific', 'asciidoc', 'compatMode'],
                              e.target.value
                            )
                          }
                          className="option-select"
                        >
                          <option value="asciidoctor">Asciidoctor</option>
                          <option value="asciidoc">AsciiDoc</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {targetFormat !== 'markdown' && targetFormat !== 'asciidoc' && (
                    <p className="conversion-profiles-active-empty">Aucune option</p>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};
