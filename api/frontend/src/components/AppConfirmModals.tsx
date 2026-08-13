/**
 * Modales de confirmation Ascend regroupées (hors historique / settings panel).
 */

import React from 'react';
import type { FormatType } from '../types';
import { useT } from '../i18n/LocaleContext';
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

  showCloseSessionTabModal: boolean;
  onCloseCloseSessionTab: () => void;
  onConfirmCloseSessionTab: () => void;

  showCloseAllSessionTabsModal: boolean;
  closeAllSessionTabsMode?: 'all' | 'others';
  onCloseCloseAllSessionTabs: () => void;
  onConfirmCloseAllSessionTabs: () => void;

  showClearSourceModal: boolean;
  onCloseClearSource: () => void;
  onConfirmClearSourceOnly: () => void;
  onConfirmClearSourceAndResult: () => void;

  showReplaceSourceModal: boolean;
  onCloseReplaceSource: () => void;
  onConfirmReplaceSource: () => void;

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

export const AppConfirmModals: React.FC<AppConfirmModalsProps> = (props) => {
  const t = useT();
  const {
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
    showCloseSessionTabModal,
    onCloseCloseSessionTab,
    onConfirmCloseSessionTab,
    showCloseAllSessionTabsModal,
    closeAllSessionTabsMode = 'all',
    onCloseCloseAllSessionTabs,
    onConfirmCloseAllSessionTabs,
    showClearSourceModal,
    onCloseClearSource,
    onConfirmClearSourceOnly,
    onConfirmClearSourceAndResult,
    showReplaceSourceModal,
    onCloseReplaceSource,
    onConfirmReplaceSource,
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
  } = props;

  return (
    <>
      <Modal
        isOpen={showDiscardSettingsModal}
        onClose={onCloseDiscardSettings}
        title={t('modal.discard.title')}
        message={t('modal.discard.message')}
        confirmText={t('modal.discard.confirm')}
        cancelText={t('modal.discard.cancel')}
        type="warning"
        onConfirm={onConfirmDiscardSettings}
      />

      <Modal
        isOpen={showResetSettingsModal}
        onClose={onCloseResetSettings}
        title={t('modal.resetSettings.title')}
        message={t('modal.resetSettings.message')}
        confirmText={t('modal.resetSettings.confirm')}
        cancelText={t('common.cancel')}
        type="warning"
        onConfirm={onConfirmResetSettings}
      />

      <Modal
        isOpen={showConfirmConvertModal}
        onClose={onCloseConfirmConvert}
        title={t('modal.convert.title')}
        message={t('modal.convert.message', { from: sourceFormat, to: targetFormat })}
        confirmText={t('convert.cta')}
        cancelText={t('common.cancel')}
        type="info"
        onConfirm={onConfirmConvert}
      />

      <Modal
        isOpen={showClearLocalDataModal}
        onClose={onCloseClearLocalData}
        title={t('modal.clearLocal.title')}
        message={t('modal.clearLocal.message')}
        confirmText={t('modal.clearLocal.confirm')}
        cancelText={t('common.cancel')}
        type="danger"
        autoFocusConfirm
        onConfirm={onConfirmClearLocalData}
      />

      <Modal
        isOpen={showClearHistoryModal}
        onClose={onCloseClearHistory}
        title={t('modal.clearHistory.title')}
        message={t('modal.clearHistory.message')}
        confirmText={t('modal.clearHistory.confirm')}
        cancelText={t('common.cancel')}
        type="danger"
        autoFocusConfirm
        onConfirm={onConfirmClearHistory}
      />

      <Modal
        isOpen={showEditModal}
        onClose={onCloseEditModal}
        title={t('modal.edit.title')}
        message={t('modal.edit.message')}
        confirmText={t('modal.edit.confirm')}
        cancelText={t('common.cancel')}
        type="info"
        onConfirm={onConfirmEdit}
      />

      <Modal
        isOpen={showSaveModal}
        onClose={onCloseSaveModal}
        title={t('modal.saveEdits.title')}
        message={t('modal.saveEdits.message')}
        confirmText={t('modal.saveEdits.confirm')}
        cancelText={t('modal.continueEdit')}
        type="info"
        onConfirm={onConfirmSave}
      />

      <Modal
        isOpen={showCancelModal}
        onClose={onCloseCancelModal}
        title={t('modal.cancelEdit.title')}
        message={t('modal.cancelEdit.message')}
        confirmText={t('modal.cancelEdit.confirm')}
        cancelText={t('modal.continueEdit')}
        type="warning"
        onConfirm={onConfirmCancelEdit}
      />

      <Modal
        isOpen={showClearResultModal}
        onClose={onCloseClearResult}
        title={t('modal.clearResult.title')}
        message={t('modal.clearResult.message')}
        confirmText={t('common.clear')}
        cancelText={t('common.cancel')}
        type="danger"
        autoFocusConfirm
        onConfirm={onConfirmClearResult}
      />

      <Modal
        isOpen={showCloseSessionTabModal}
        onClose={onCloseCloseSessionTab}
        title={t('modal.closeSessionTab.title')}
        message={t('modal.closeSessionTab.message')}
        confirmText={t('modal.closeSessionTab.confirm')}
        cancelText={t('common.cancel')}
        type="warning"
        onConfirm={onConfirmCloseSessionTab}
      />

      <Modal
        isOpen={showCloseAllSessionTabsModal}
        onClose={onCloseCloseAllSessionTabs}
        title={
          closeAllSessionTabsMode === 'others'
            ? t('modal.closeOtherSessionTabs.title')
            : t('modal.closeAllSessionTabs.title')
        }
        message={
          closeAllSessionTabsMode === 'others'
            ? t('modal.closeOtherSessionTabs.message')
            : t('modal.closeAllSessionTabs.message')
        }
        confirmText={
          closeAllSessionTabsMode === 'others'
            ? t('modal.closeOtherSessionTabs.confirm')
            : t('modal.closeAllSessionTabs.confirm')
        }
        cancelText={t('common.cancel')}
        type="warning"
        onConfirm={onConfirmCloseAllSessionTabs}
      />

      <Modal
        isOpen={showClearSourceModal}
        onClose={onCloseClearSource}
        title={t('modal.clearSource.title')}
        message={t('modal.clearSource.message')}
        type="danger"
        stackActions
        footer={
          <>
            <button type="button" className="modal-button confirm info" onClick={onConfirmClearSourceOnly}>
              {t('modal.sourceOnly')}
            </button>
            <button type="button" className="modal-button confirm warning" onClick={onConfirmClearSourceAndResult}>
              {t('modal.sourceAndResult')}
            </button>
            <button type="button" className="modal-button cancel" onClick={onCloseClearSource}>
              {t('common.cancel')}
            </button>
          </>
        }
      />

      <Modal
        isOpen={showReplaceSourceModal}
        onClose={onCloseReplaceSource}
        title={t('modal.replaceSource.title')}
        message={t('modal.replaceSource.message')}
        confirmText={t('modal.replaceSource.confirm')}
        cancelText={t('common.cancel')}
        type="warning"
        onConfirm={onConfirmReplaceSource}
      />

      <Modal
        isOpen={Boolean(showConversionModal && confirmationToken && pendingConversion)}
        onClose={onCloseConversionConfirm}
        title={t('modal.convert.title')}
        message={
          pendingConversion ? (
            <>
              <p>
                {t('modal.convert.fromTo', {
                  from: getFormatTitle(pendingConversion.fromFormat),
                  to: getFormatTitle(pendingConversion.toFormat),
                })}
              </p>
              <p className="modal-body-note">{t('modal.convert.explicitNote')}</p>
            </>
          ) : null
        }
        confirmText={t('convert.cta')}
        cancelText={t('common.cancel')}
        type="warning"
        onConfirm={onConfirmAndConvert}
        onCancel={onCancelConversionConfirm}
      />

      <Modal
        isOpen={showConversionErrorModal}
        onClose={onCloseConversionError}
        title={t('modal.error.title')}
        type="danger"
        showCancel={false}
        confirmText={t('modal.error.understood')}
        autoFocusConfirm
        contentClassName="conversion-error-modal"
        onConfirm={onCloseConversionError}
        message={
          <>
            {conversionErrorDetails.code && (
              <p className="conversion-error-code">
                {t('modal.error.code')} : <code>{conversionErrorDetails.code}</code>
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
                {t('modal.error.id')} : <code>{conversionErrorDetails.requestId}</code>
              </p>
            )}
          </>
        }
      />
    </>
  );
};
