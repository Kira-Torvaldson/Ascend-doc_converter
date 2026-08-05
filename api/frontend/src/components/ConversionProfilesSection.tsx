/**
 * Profils de conversion — menu déroulant + sous-catégorie des actifs.
 * L’application se fait au clic dans le menu.
 */

import React, { useMemo, useState } from 'react';
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
      CONVERSION_PROFILES.map((p) => ({
        value: p.id,
        label: activeProfileIds.includes(p.id) ? `${p.label} · actif` : p.label,
      })),
    [activeProfileIds]
  );

  const handleSelectProfile = (profileId: string) => {
    if (activeProfileIds.includes(profileId)) {
      onToggleProfile(profileId);
      setSelectedProfileId(profileId);
      return;
    }
    setSelectedProfileId(profileId);
    // Toujours déléguer : App affiche le snackbar « max atteint » si besoin
    onToggleProfile(profileId);
  };

  return (
    <div className="sidebar-section">
      <h3 className="sidebar-title">
        <span>Profils</span>
        <span
          className={[
            'conversion-profiles-count',
            activeProfiles.length > 0 ? 'has-active' : '',
            atMax ? 'is-full' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-live="polite"
        >
          {activeProfileIds.length}/{MAX_ACTIVE_PROFILES}
        </span>
      </h3>

      <div className="sidebar-content conversion-profiles">
        <div className="other-options-picker conversion-profiles-picker">
          <SidebarListbox
            id="conversion-profile"
            label="Profil"
            value={selectedProfileId}
            options={profileOptions}
            onChange={handleSelectProfile}
          />
        </div>

        <div className="conversion-profiles-active-block">
          <div className="conversion-profiles-active-head">
            <p className="option-panel-caption">Profils actifs</p>
            {onClearProfiles && activeProfiles.length > 0 && (
              <button
                type="button"
                className="conversion-profiles-clear"
                onClick={onClearProfiles}
              >
                Tout retirer
              </button>
            )}
          </div>

          {activeProfiles.length === 0 ? (
            <p className="conversion-profiles-active-empty">Aucun</p>
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
                    aria-label={`Retirer ${profile.label}`}
                    data-tooltip="Retirer"
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
