/**
 * Sidebar conversion : formats + Autres options / profils.
 */

import React from 'react';
import type { FormatType, ConversionOptions } from '../types';
import { useT } from '../i18n/LocaleContext';
import { FormatSelector } from './FormatSelector';
import { FormatPairsBar } from './FormatPairsBar';
import { OtherOptionsPanel, type OtherOptionsCategory } from './OtherOptionsPanel';
import { isSupportedUiConversion, type FormatPair } from '../utils/conversionPairs';

export interface ConversionSidebarProps {
  sidebarCollapsed: boolean;
  onCollapse: () => void;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  onSourceFormatChange: (format: FormatType) => void;
  onTargetFormatChange: (format: FormatType) => void;
  otherOptionsCategory: string;
  otherOptionsCategories: OtherOptionsCategory[];
  onCategoryChange: (id: string) => void;
  conversionOptions: ConversionOptions;
  updateOption: (path: string[], value: unknown) => void;
  navigationEnabled: boolean;
  onNavigationToggle: (enabled: boolean) => void;
  headingsCount: number;
  activeProfileIds: string[];
  onToggleProfile: (profileId: string) => void;
  onClearProfiles: () => void;
  recentPairs: FormatPair[];
  favoritePairs: FormatPair[];
  onApplyFormatPair: (source: FormatType, target: FormatType) => void;
  onToggleFavoritePair: (source: FormatType, target: FormatType) => void;
  formatsLocked?: boolean;
}

export const ConversionSidebar: React.FC<ConversionSidebarProps> = (props) => {
  const t = useT();
  const {
    sidebarCollapsed,
    onCollapse,
    sourceFormat,
    targetFormat,
    onSourceFormatChange,
    onTargetFormatChange,
    otherOptionsCategory,
    otherOptionsCategories,
    onCategoryChange,
    conversionOptions,
    updateOption,
    navigationEnabled,
    onNavigationToggle,
    headingsCount,
    activeProfileIds,
    onToggleProfile,
    onClearProfiles,
    recentPairs,
    favoritePairs,
    onApplyFormatPair,
    onToggleFavoritePair,
    formatsLocked = false,
  } = props;

  return (
    <aside
      id="ascend-sidebar"
      className="sidebar"
      aria-hidden={sidebarCollapsed}
    >
      <div className="sidebar-section">
        <div className="sidebar-section-top">
          <h3 className="sidebar-title">{t('sidebar.title')}</h3>
          <button
            type="button"
            className="sidebar-collapse-inline"
            onClick={onCollapse}
            aria-label={t('sidebar.hide')}
          >
            «
          </button>
        </div>
        <div className="sidebar-content">
          <FormatSelector
            id="format-source"
            label={t('sidebar.sourceFormat')}
            value={sourceFormat}
            onChange={onSourceFormatChange}
            disabled={formatsLocked}
          />
          <FormatSelector
            id="format-target"
            label={t('sidebar.targetFormat')}
            value={targetFormat}
            onChange={onTargetFormatChange}
            disabled={formatsLocked}
          />
          <FormatPairsBar
            sourceFormat={sourceFormat}
            targetFormat={targetFormat}
            recentPairs={recentPairs}
            favoritePairs={favoritePairs}
            onApplyPair={onApplyFormatPair}
            onToggleFavorite={onToggleFavoritePair}
            applyDisabled={formatsLocked}
          />
          {!isSupportedUiConversion(sourceFormat, targetFormat) ? (
            <div className="conversion-warning" role="status">
              {t('conversion.supportedHint')}
            </div>
          ) : null}
        </div>
      </div>
      <OtherOptionsPanel
        category={otherOptionsCategory}
        categories={otherOptionsCategories}
        onCategoryChange={onCategoryChange}
        conversionOptions={conversionOptions}
        updateOption={updateOption}
        targetFormat={targetFormat}
        navigationEnabled={navigationEnabled}
        onNavigationToggle={onNavigationToggle}
        headingsCount={headingsCount}
        activeProfileIds={activeProfileIds}
        onToggleProfile={onToggleProfile}
        onClearProfiles={onClearProfiles}
      />
    </aside>
  );
};
