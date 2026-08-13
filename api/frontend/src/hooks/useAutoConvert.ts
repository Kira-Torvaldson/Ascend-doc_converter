/**
 * Auto-convert : stamps, snapshots, et planification idle.
 */

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { ConversionOptions, FormatType } from '../types';
import type { UserSettings } from '../settings/userSettings';
import {
  AUTO_CONVERT_IDLE_MS,
  bumpAutoConvertFail,
  conversionOptionsStamp,
  decideAutoConvert,
  sourceAutoConvertKey,
} from '../utils/autoConvert';
import { conversionNeedsConfirmationToken } from '../utils/conversionPairs';

export type UseAutoConvertStateArgs = {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  adocInput: string;
  mdOutput: string;
  conversionOptions: ConversionOptions;
  userSettings: UserSettings;
};

export function useAutoConvertState({
  sourceFormat,
  targetFormat,
  adocInput,
  mdOutput,
  conversionOptions,
  userSettings,
}: UseAutoConvertStateArgs) {
  const [autoConvertPending, setAutoConvertPending] = useState(false);
  const lastAutoConvertKeyRef = useRef(
    sourceAutoConvertKey(
      sourceFormat,
      targetFormat,
      sourceFormat === 'markdown' ? mdOutput : adocInput
    )
  );
  const lastAutoConvertOptionsRef = useRef('');
  const convertSnapshotKeyRef = useRef('');
  const convertSnapshotStampRef = useRef('');
  const autoConvertFailRef = useRef({ key: '', count: 0 });
  const conversionStampRef = useRef('');
  conversionStampRef.current = conversionOptionsStamp(
    conversionOptions,
    userSettings.conversion.defaultTocEnabled,
    userSettings.conversion.autoApplyUserToMetadata
  );
  if (!lastAutoConvertOptionsRef.current) {
    lastAutoConvertOptionsRef.current = conversionStampRef.current;
  }

  const seedEditorSnapshot = useCallback(
    (source: FormatType, target: FormatType, sourceText: string, resetFails = false) => {
      lastAutoConvertKeyRef.current = sourceAutoConvertKey(source, target, sourceText);
      lastAutoConvertOptionsRef.current = conversionStampRef.current;
      convertSnapshotKeyRef.current = lastAutoConvertKeyRef.current;
      convertSnapshotStampRef.current = conversionStampRef.current;
      if (resetFails) {
        autoConvertFailRef.current = { key: '', count: 0 };
      }
    },
    []
  );

  const rememberLivePair = useCallback(
    (source: FormatType, target: FormatType, sourceText: string) => {
      lastAutoConvertKeyRef.current = sourceAutoConvertKey(source, target, sourceText);
      lastAutoConvertOptionsRef.current = conversionStampRef.current;
    },
    []
  );

  const syncAfterSuccessfulConvert = useCallback(
    (source: FormatType, target: FormatType, sourceText: string) => {
      const snapshotKey =
        convertSnapshotKeyRef.current || sourceAutoConvertKey(source, target, sourceText);
      const snapshotStamp = convertSnapshotStampRef.current || conversionStampRef.current;
      lastAutoConvertKeyRef.current = snapshotKey;
      lastAutoConvertOptionsRef.current = snapshotStamp;
      autoConvertFailRef.current = { key: '', count: 0 };
      return {
        snapshotKey,
        liveKey: sourceAutoConvertKey(source, target, sourceText),
      };
    },
    []
  );

  return {
    autoConvertPending,
    setAutoConvertPending,
    lastAutoConvertKeyRef,
    lastAutoConvertOptionsRef,
    convertSnapshotKeyRef,
    convertSnapshotStampRef,
    autoConvertFailRef,
    conversionStampRef,
    seedEditorSnapshot,
    rememberLivePair,
    syncAfterSuccessfulConvert,
  };
}

export type UseAutoConvertIdleArgs = {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  adocInput: string;
  mdOutput: string;
  loading: boolean;
  folderBatchRunning: boolean;
  isEditingResult: boolean;
  conversionOptions: ConversionOptions;
  userSettings: UserSettings;
  handleConvert: () => void;
  lastAutoConvertKeyRef: MutableRefObject<string>;
  lastAutoConvertOptionsRef: MutableRefObject<string>;
  autoConvertFailRef: MutableRefObject<{ key: string; count: number }>;
  conversionStampRef: MutableRefObject<string>;
  setAutoConvertPending: (value: boolean) => void;
};

export function useAutoConvertIdle({
  sourceFormat,
  targetFormat,
  adocInput,
  mdOutput,
  loading,
  folderBatchRunning,
  isEditingResult,
  conversionOptions,
  userSettings,
  handleConvert,
  lastAutoConvertKeyRef,
  lastAutoConvertOptionsRef,
  autoConvertFailRef,
  conversionStampRef,
  setAutoConvertPending,
}: UseAutoConvertIdleArgs) {
  useEffect(() => {
    const clearPending = () => setAutoConvertPending(false);
    const sourceText = sourceFormat === 'markdown' ? mdOutput : adocInput;
    const key = sourceAutoConvertKey(sourceFormat, targetFormat, sourceText);
    const stamp = conversionStampRef.current;
    const action = decideAutoConvert({
      enabled: userSettings.ui.autoConvertOnIdle,
      confirmBeforeConversion: userSettings.conversion.confirmBeforeConversion,
      busy: loading || folderBatchRunning || isEditingResult,
      sourceFormat,
      targetFormat,
      sourceText,
      lastKey: lastAutoConvertKeyRef.current,
      lastStamp: lastAutoConvertOptionsRef.current,
      currentStamp: stamp,
      failKey: autoConvertFailRef.current.key,
      failCount: autoConvertFailRef.current.count,
      needsConfirmationToken: conversionNeedsConfirmationToken(sourceFormat, targetFormat),
    });
    if (action === 'skip') {
      clearPending();
      return;
    }
    if (action === 'seed-exhausted') {
      lastAutoConvertKeyRef.current = key;
      lastAutoConvertOptionsRef.current = stamp;
      clearPending();
      return;
    }

    setAutoConvertPending(true);
    const timer = window.setTimeout(() => {
      setAutoConvertPending(false);
      autoConvertFailRef.current = bumpAutoConvertFail(autoConvertFailRef.current, key);
      handleConvert();
    }, AUTO_CONVERT_IDLE_MS);
    return () => {
      window.clearTimeout(timer);
      setAutoConvertPending(false);
    };
  }, [
    userSettings.ui.autoConvertOnIdle,
    userSettings.conversion.confirmBeforeConversion,
    adocInput,
    mdOutput,
    sourceFormat,
    targetFormat,
    loading,
    folderBatchRunning,
    isEditingResult,
    handleConvert,
    conversionOptions,
    userSettings.conversion.defaultTocEnabled,
    userSettings.conversion.autoApplyUserToMetadata,
    lastAutoConvertKeyRef,
    lastAutoConvertOptionsRef,
    autoConvertFailRef,
    conversionStampRef,
    setAutoConvertPending,
  ]);
}
