/**
 * Sidebar conversion : formats + Autres options / profils.
 */

import React from 'react';
import type { FormatType, ConversionOptions } from '../types';
import { FormatSelector } from './FormatSelector';
import { OtherOptionsPanel, type OtherOptionsCategory } from './OtherOptionsPanel';

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
}

export const ConversionSidebar: React.FC<ConversionSidebarProps> = ({
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
}) => (
  <aside
    id="ascend-sidebar"
    className="sidebar"
    aria-hidden={sidebarCollapsed}
  >
    <div className="sidebar-section">
      <div className="sidebar-section-top">
        <h3 className="sidebar-title">Options de conversion</h3>
        <button
          type="button"
          className="sidebar-collapse-inline"
          onClick={onCollapse}
          aria-label="Masquer les options"
        >
          «
        </button>
      </div>
      <div className="sidebar-content">
        <FormatSelector
          id="format-source"
          label="Format source"
          value={sourceFormat}
          onChange={onSourceFormatChange}
        />
        <FormatSelector
          id="format-target"
          label="Format destination"
          value={targetFormat}
          onChange={onTargetFormatChange}
        />
        {(() => {
          const ok =
            (sourceFormat === 'asciidoc' && targetFormat === 'markdown') ||
            (sourceFormat === 'markdown' && targetFormat === 'asciidoc') ||
            (sourceFormat === 'html' &&
              (targetFormat === 'markdown' || targetFormat === 'txt' || targetFormat === 'asciidoc')) ||
            (sourceFormat === 'markdown' && targetFormat === 'html') ||
            (sourceFormat === 'txt' && (targetFormat === 'markdown' || targetFormat === 'html'))
          return !ok ? (
            <div className="conversion-warning" role="status">
              Couples supportés : AsciiDoc↔Markdown, HTML→Markdown/TXT, Markdown→HTML, TXT→Markdown/HTML.
            </div>
          ) : null
        })()}
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
