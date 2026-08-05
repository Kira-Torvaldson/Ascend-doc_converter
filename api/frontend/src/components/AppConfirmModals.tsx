/**
 * Modales de confirmation Ascend regroupées (hors historique / settings panel).
 */

import React from 'react';
import type { FormatType } from '../types';
import { Modal } from './Modal';

export interface ConversionErrorDetails {
  code: string;
  message: string;
  hint: string;
  requestId: string;
}

export interface PendingConversionInfo {
  fromFormat: FormatType;
  toFormat: FormatType;
}

export interface AppConfirmModalsProps {
  showDiscardSettingsModal: boolean;
  onCloseDiscardSettings: () => void;
  onConfirmDiscardSettings: () => void;

  showResetSettingsModal: boolean;
  onCloseResetSettings: () => void;
  onConfirmResetSettings: () => void;

  showConfirmConvertModal: boolean;
  onCloseConfirmConvert: () => void;
  onConfirmConvert: () => void;
  sourceFormat: FormatType;
  targetFormat: FormatType;

  showClearLocalDataModal: boolean;
  onCloseClearLocalData: () => void;
  onConfirmClearLocalData: () => void;

  showClearHistoryModal: boolean;
  onCloseClearHistory: () => void;
  onConfirmClearHistory: () => void;

  showEditModal: boolean;
  onCloseEditModal: () => void;
  onConfirmEdit: () => void;

  showSaveModal: boolean;
  onCloseSaveModal: () => void;
  onConfirmSave: () => void;

  showCancelModal: boolean;
  onCloseCancelModal: () => void;
  onConfirmCancelEdit: () => void;

  showClearResultModal: boolean;
  onCloseClearResult: () => void;
  onConfirmClearResult: () => void;

  showClearSourceModal: boolean;
  onCloseClearSource: () => void;
  onConfirmClearSourceOnly: () => void;
  onConfirmClearSourceAndResult: () => void;

  showConversionModal: boolean;
  confirmationToken: string | null;
  pendingConversion: PendingConversionInfo | null;
  onCloseConversionConfirm: () => void;
  onConfirmAndConvert: () => void;
  onCancelConversionConfirm: () => void;
  getFormatTitle: (format: FormatType) => string;

  showConversionErrorModal: boolean;
  onCloseConversionError: () => void;
  conversionErrorDetails: ConversionErrorDetails;
}

export const AppConfirmModals: React.FC<AppConfirmModalsProps> = ({
  showDiscardSettingsModal,
  onCloseDiscardSettings,
  onConfirmDiscardSettings,
  showResetSettingsModal,
  onCloseResetSettings,
  onConfirmResetSettings,
  showConfirmConvertModal,
  onCloseConfirmConvert,
  onConfirmConvert,
  sourceFormat,
  targetFormat,
  showClearLocalDataModal,
  onCloseClearLocalData,
  onConfirmClearLocalData,
  showClearHistoryModal,
  onCloseClearHistory,
  onConfirmClearHistory,
  showEditModal,
  onCloseEditModal,
  onConfirmEdit,
  showSaveModal,
  onCloseSaveModal,
  onConfirmSave,
  showCancelModal,
  onCloseCancelModal,
  onConfirmCancelEdit,
  showClearResultModal,
  onCloseClearResult,
  onConfirmClearResult,
  showClearSourceModal,
  onCloseClearSource,
  onConfirmClearSourceOnly,
  onConfirmClearSourceAndResult,
  showConversionModal,
  confirmationToken,
  pendingConversion,
  onCloseConversionConfirm,
  onConfirmAndConvert,
  onCancelConversionConfirm,
  getFormatTitle,
  showConversionErrorModal,
  onCloseConversionError,
  conversionErrorDetails,
}) => (
  <>
    <Modal
      isOpen={showDiscardSettingsModal}
      onClose={onCloseDiscardSettings}
      title="Modifications non enregistrées"
      message="Des modifications n’ont pas été appliquées. Quitter sans enregistrer ?"
      confirmText="Quitter sans enregistrer"
      cancelText="Continuer l’édition"
      type="warning"
      onConfirm={onConfirmDiscardSettings}
    />

    <Modal
      isOpen={showResetSettingsModal}
      onClose={onCloseResetSettings}
      title="Réinitialiser les paramètres"
      message="Remettre le brouillon aux valeurs par défaut ? Vous devrez ensuite cliquer Appliquer pour enregistrer."
      confirmText="Réinitialiser"
      cancelText="Annuler"
      type="warning"
      onConfirm={onConfirmResetSettings}
    />

    <Modal
      isOpen={showConfirmConvertModal}
      onClose={onCloseConfirmConvert}
      title="Confirmer la conversion"
      message={`Convertir ${sourceFormat} → ${targetFormat} ?`}
      confirmText="Convertir"
      cancelText="Annuler"
      type="info"
      onConfirm={onConfirmConvert}
    />

    <Modal
      isOpen={showClearLocalDataModal}
      onClose={onCloseClearLocalData}
      title="Effacer les données locales"
      message="Historique, brouillon de session, fond personnalisé et préférences Ascend seront effacés sur cet appareil. Continuer ?"
      confirmText="Tout effacer"
      cancelText="Annuler"
      type="danger"
      autoFocusConfirm
      onConfirm={onConfirmClearLocalData}
    />

    <Modal
      isOpen={showClearHistoryModal}
      onClose={onCloseClearHistory}
      title="Effacer l’historique"
      message="Êtes-vous sûr de vouloir effacer tout l’historique ? Cette action est irréversible."
      confirmText="Effacer tout"
      cancelText="Annuler"
      type="danger"
      autoFocusConfirm
      onConfirm={onConfirmClearHistory}
    />

    <Modal
      isOpen={showEditModal}
      onClose={onCloseEditModal}
      title="Activer l’édition"
      message="Voulez-vous activer le mode édition pour modifier le contenu ?"
      confirmText="Activer"
      cancelText="Annuler"
      type="info"
      onConfirm={onConfirmEdit}
    />

    <Modal
      isOpen={showSaveModal}
      onClose={onCloseSaveModal}
      title="Sauvegarder les modifications"
      message="Enregistrer les modifications et quitter le mode édition ?"
      confirmText="Sauvegarder"
      cancelText="Continuer l’édition"
      type="info"
      onConfirm={onConfirmSave}
    />

    <Modal
      isOpen={showCancelModal}
      onClose={onCloseCancelModal}
      title="Annuler l’édition"
      message="Les modifications non sauvegardées seront perdues."
      confirmText="Abandonner"
      cancelText="Continuer l’édition"
      type="warning"
      onConfirm={onConfirmCancelEdit}
    />

    <Modal
      isOpen={showClearResultModal}
      onClose={onCloseClearResult}
      title="Effacer le résultat"
      message="Voulez-vous effacer le résultat ? Cette action est irréversible."
      confirmText="Effacer"
      cancelText="Annuler"
      type="danger"
      autoFocusConfirm
      onConfirm={onConfirmClearResult}
    />

    <Modal
      isOpen={showClearSourceModal}
      onClose={onCloseClearSource}
      title="Effacer la source"
      message="Que souhaitez-vous effacer ?"
      type="danger"
      stackActions
      footer={
        <>
          <button type="button" className="modal-button confirm info" onClick={onConfirmClearSourceOnly}>
            Source uniquement
          </button>
          <button type="button" className="modal-button confirm warning" onClick={onConfirmClearSourceAndResult}>
            Source et résultat
          </button>
          <button type="button" className="modal-button cancel" onClick={onCloseClearSource}>
            Annuler
          </button>
        </>
      }
    />

    <Modal
      isOpen={Boolean(showConversionModal && confirmationToken && pendingConversion)}
      onClose={onCloseConversionConfirm}
      title="Confirmer la conversion"
      message={
        pendingConversion ? (
          <>
            <p>
              Convertir de <strong>{getFormatTitle(pendingConversion.fromFormat)}</strong> vers{' '}
              <strong>{getFormatTitle(pendingConversion.toFormat)}</strong> ?
            </p>
            <p className="modal-body-note">Cette action nécessite une confirmation explicite.</p>
          </>
        ) : null
      }
      confirmText="Convertir"
      cancelText="Annuler"
      type="warning"
      onConfirm={onConfirmAndConvert}
      onCancel={onCancelConversionConfirm}
    />

    <Modal
      isOpen={showConversionErrorModal}
      onClose={onCloseConversionError}
      title="Erreur de conversion"
      type="danger"
      showCancel={false}
      confirmText="Compris"
      autoFocusConfirm
      contentClassName="conversion-error-modal"
      onConfirm={onCloseConversionError}
      message={
        <>
          {conversionErrorDetails.code && (
            <p className="conversion-error-code">
              Code : <code>{conversionErrorDetails.code}</code>
            </p>
          )}
          <p className="conversion-error-message">{conversionErrorDetails.message}</p>
          {conversionErrorDetails.hint && (
            <div className="conversion-error-hint-box">
              <p className="conversion-error-hint">{conversionErrorDetails.hint}</p>
            </div>
          )}
          {conversionErrorDetails.requestId && (
            <p className="conversion-error-request-id">
              Identifiant : <code>{conversionErrorDetails.requestId}</code>
            </p>
          )}
        </>
      }
    />
  </>
);
