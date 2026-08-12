/**
 * Profils de conversion — menu déroulant + sous-catégorie des actifs.
 * L’application se fait au clic dans le menu.
 */

import React, { useMemo, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import { SidebarListbox } from './SidebarListbox';
import {
  CONVERSION_PROFILES,
  MAX_ACTIVE_PROFILES,
} from '../utils/conversionProfiles';

interface ConversionProfilesSectionProps {
  activeProfileIds: string[];
  onToggleProfile: (profileId: string) => void;
  onClearProfiles?: () => void;
}

export const ConversionProfilesSection: React.FC<ConversionProfilesSectionProps> = ({
  activeProfileIds,
  onToggleProfile,
  onClearProfiles,
}) => {
  const t = useT();
  const [selectedProfileId, setSelectedProfileId] = useState(
    () => CONVERSION_PROFILES[0]?.id ?? 'bookstack'
  );

  const atMax = activeProfileIds.length >= MAX_ACTIVE_PROFILES;

  const activeProfiles = useMemo(
    () =>
      activeProfileIds
        .map((id) => CONVERSION_PROFILES.find((p) => p.id === id))
        .filter((p): p is (typeof CONVERSION_PROFILES)[number] => !!p),
    [activeProfileIds]
  );

  const profileOptions = useMemo(
    () =>
      CONVERSION_PROFILES.map((p) => {
        const active = activeProfileIds.includes(p.id);
        return {
          value: p.id,
          label: active ? `${p.label} · ${t('profiles.activeBadge')}` : p.label,
          disabled: atMax && !active,
        };
      }),
    [activeProfileIds, atMax, t]
  );

  const handleSelectProfile = (profileId: string) => {
    if (activeProfileIds.includes(profileId)) {
      onToggleProfile(profileId);
      setSelectedProfileId(profileId);
      return;
    }
    setSelectedProfileId(profileId);
    onToggleProfile(profileId);
  };

  return (
    <div className="sidebar-section">
      <h3 className="sidebar-title">
        <span>{t('profiles.title')}</span>
        <span
          className={[
            'conversion-profiles-count',
            activeProfiles.length > 0 ? 'has-active' : '',
            atMax ? 'is-full' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-live="polite"
          data-tooltip={atMax ? t('profiles.maxHint', { count: MAX_ACTIVE_PROFILES }) : undefined}
        >
          {activeProfileIds.length}/{MAX_ACTIVE_PROFILES}
        </span>
      </h3>

      {atMax ? (
        <p className="conversion-profiles-max-hint">{t('profiles.maxHint', { count: MAX_ACTIVE_PROFILES })}</p>
      ) : null}

      <div className="sidebar-content conversion-profiles">
        <div className="other-options-picker conversion-profiles-picker">
          <SidebarListbox
            id="conversion-profile"
            label={t('profiles.label')}
            value={selectedProfileId}
            options={profileOptions}
            onChange={handleSelectProfile}
          />
        </div>

        <div className="conversion-profiles-active-block">
          <div className="conversion-profiles-active-head">
            <p className="option-panel-caption">{t('profiles.active')}</p>
            {onClearProfiles && activeProfiles.length > 0 && (
              <button
                type="button"
                className="conversion-profiles-clear"
                onClick={onClearProfiles}
              >
                {t('profiles.clearAll')}
              </button>
            )}
          </div>

          {activeProfiles.length === 0 ? (
            <p className="conversion-profiles-active-empty">{t('profiles.none')}</p>
          ) : (
            <ul className="conversion-profiles-active-list">
              {activeProfiles.map((profile, index) => (
                <li key={profile.id} className="conversion-profiles-active-item">
                  <span className="conversion-profiles-active-order" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="conversion-profiles-active-name">{profile.label}</span>
                  <button
                    type="button"
                    className="conversion-profiles-active-remove"
                    onClick={() => {
                      onToggleProfile(profile.id);
                      setSelectedProfileId(profile.id);
                    }}
                    aria-label={`${t('profiles.remove')} ${profile.label}`}
                    data-tooltip={t('profiles.remove')}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
