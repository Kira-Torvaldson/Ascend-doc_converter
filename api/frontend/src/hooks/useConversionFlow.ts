/**
 * Flux de conversion : token, livraison du résultat, historique, confirmation.
 */

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { convertText, requestConfirmationToken } from '../converters';
import type { ConversionHistoryItem, ConversionOptions, FormatType } from '../types';
import type { MessageKey } from '../i18n/messages';
import type { UserSettings } from '../settings/userSettings';
import { appendDocumentSignature, applyProfileToMetadata } from '../settings/profileIdentity';
import {
  shouldMarkTabCleanAfterConvert,
  sourceAutoConvertKey,
} from '../utils/autoConvert';
import {
  buildConversionHistoryItem,
  persistConversionHistory,
  prependConversionHistory,
  shouldRecordConversionHistory,
} from '../utils/conversionHistory';
import { sanitizeActiveProfileIds } from '../utils/conversionProfiles';
import {
  applyResultToBuffers,
  conversionNeedsConfirmationToken,
  decideConversionResultDest,
  isSupportedUiConversion,
  resolveConvertRequestSnap,
  SUPPORTED_CONVERSION_HINT,
  writeResultBuffer,
} from '../utils/conversionPairs';
import type { SessionTabSnapshot } from '../utils/sessionDraft';

type Notify = {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
};

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

type ConversionUiState = 'idle' | 'loading' | 'success' | 'error';

export type ConvertRequestSnap = {
  tabId: string;
  sourceText: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
};

export type LiveEditorSnapshot = {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  activeSessionTabId: string;
  sourceText: string;
};

export type PendingTokenConversion = {
  fromFormat: FormatType;
  toFormat: FormatType;
  token: string;
  sourceText: string;
  tabId: string;
};

function applyTocAndProfile(
  conversionOptions: ConversionOptions,
  userSettings: UserSettings
): ConversionOptions {
  let opts = conversionOptions;
  if (userSettings.conversion.defaultTocEnabled && opts.rendering) {
    opts = {
      ...opts,
      rendering: {
        ...opts.rendering,
        tableOfContents: { ...opts.rendering.tableOfContents, enabled: true },
      },
    };
  } else if (userSettings.conversion.defaultTocEnabled) {
    opts = { ...opts, rendering: { tableOfContents: { enabled: true } } };
  }
  if (userSettings.conversion.autoApplyUserToMetadata) {
    const metadata = applyProfileToMetadata(opts.metadata, userSettings.profile, 'fillEmpty');
    opts = { ...opts, metadata };
  }
  return opts;
}

export type UseConversionFlowArgs = {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  adocInput: string;
  mdOutput: string;
  loading: boolean;
  justConverted: boolean;
  folderBatchRunning: boolean;
  isEditingResult: boolean;
  activeSessionTabId: string;
  conversionOptions: ConversionOptions;
  userSettings: UserSettings;
  activeProfileIds: string[];
  maxSourceSizeMb: number;
  conversionTimeoutMs: number;
  t: TranslateFn;
  liveEditorRef: MutableRefObject<LiveEditorSnapshot>;
  conversionAbortRef: MutableRefObject<AbortController | null>;
  convertSnapshotKeyRef: MutableRefObject<string>;
  convertSnapshotStampRef: MutableRefObject<string>;
  conversionStampRef: MutableRefObject<string>;
  showSnackbar: (message: string) => void;
  patchSessionTabContent: (
    id: string,
    updater: (tab: SessionTabSnapshot) => SessionTabSnapshot
  ) => void;
  setAdocInput: (value: string) => void;
  setMdOutput: (value: string) => void;
  setOtherOutput: (value: string) => void;
  setLoading: (value: boolean) => void;
  setStatus: (value: string) => void;
  setNotification: (value: Notify | null) => void;
  setJustConverted: (value: boolean) => void;
  setSourceModified: (value: boolean) => void;
  setResultModified: (value: boolean) => void;
  setConversionUiState: (value: ConversionUiState) => void;
  setLastBackendConversionResult: (value: unknown) => void;
  setShowConversionErrorModal: (value: boolean) => void;
  setConversionErrorMessage: (value: string) => void;
  setConversionHistory: (
    value: ConversionHistoryItem[] | ((prev: ConversionHistoryItem[]) => ConversionHistoryItem[])
  ) => void;
};

export function useConversionFlow({
  sourceFormat,
  targetFormat,
  adocInput,
  mdOutput,
  loading,
  justConverted,
  folderBatchRunning,
  isEditingResult,
  activeSessionTabId,
  conversionOptions,
  userSettings,
  activeProfileIds,
  maxSourceSizeMb,
  conversionTimeoutMs,
  t,
  liveEditorRef,
  conversionAbortRef,
  convertSnapshotKeyRef,
  convertSnapshotStampRef,
  conversionStampRef,
  showSnackbar,
  patchSessionTabContent,
  setAdocInput,
  setMdOutput,
  setOtherOutput,
  setLoading,
  setStatus,
  setNotification,
  setJustConverted,
  setSourceModified,
  setResultModified,
  setConversionUiState,
  setLastBackendConversionResult,
  setShowConversionErrorModal,
  setConversionErrorMessage,
  setConversionHistory,
}: UseConversionFlowArgs) {
  const [, setLastAttemptId] = useState(0);
  const activeAttemptIdRef = useRef(0);
  const convertOriginRef = useRef<ConvertRequestSnap | null>(null);
  const lastOutputDestRef = useRef<'live' | 'tab' | 'skip' | null>(null);
  const pendingConfirmConvertRef = useRef<ConvertRequestSnap | null>(null);

  const [showConfirmConvertModal, setShowConfirmConvertModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
  const [pendingConversion, setPendingConversion] = useState<PendingTokenConversion | null>(null);

  const beginConvertAttempt = useCallback(
    (from: FormatType, to: FormatType, sourceText: string, tabId?: string) => {
      convertSnapshotKeyRef.current = sourceAutoConvertKey(from, to, sourceText);
      convertSnapshotStampRef.current = conversionStampRef.current;
      convertOriginRef.current = {
        tabId: tabId ?? liveEditorRef.current.activeSessionTabId,
        sourceFormat: from,
        targetFormat: to,
        sourceText,
      };
      lastOutputDestRef.current = null;
    },
    [convertSnapshotKeyRef, convertSnapshotStampRef, conversionStampRef, liveEditorRef]
  );

  const recordConversionHistory = useCallback(
    (input: {
      fromFormat: FormatType;
      toFormat: FormatType;
      sourceContent: string;
      resultContent: string;
    }) => {
      if (!userSettings.conversion.saveConversionHistory) return;
      const historyItem = buildConversionHistoryItem({
        ...input,
        conversionOptions,
        activeProfileIds: sanitizeActiveProfileIds(activeProfileIds),
      });
      if (!historyItem) return;
      const limit = userSettings.conversion.historyLimit || 50;
      setConversionHistory((prev) => {
        const next = prependConversionHistory(prev, historyItem, limit);
        persistConversionHistory(next);
        return next;
      });
    },
    [
      userSettings.conversion.saveConversionHistory,
      userSettings.conversion.historyLimit,
      conversionOptions,
      activeProfileIds,
      setConversionHistory,
    ]
  );

  const deliverConversionOutput = useCallback(
    (raw: string) => {
      const origin = convertOriginRef.current;
      const live = liveEditorRef.current;
      const next = appendDocumentSignature(raw, userSettings.profile);
      const record = (
        from: FormatType,
        to: FormatType,
        sourceContent: string,
        dest: 'live' | 'tab' | 'skip' | null
      ) => {
        if (!shouldRecordConversionHistory(dest)) return;
        recordConversionHistory({
          fromFormat: from,
          toFormat: to,
          sourceContent,
          resultContent: next,
        });
      };
      if (!origin) {
        lastOutputDestRef.current = 'live';
        writeResultBuffer(live.sourceFormat, live.targetFormat, next, {
          setAdocInput,
          setMdOutput,
          setOtherOutput,
        });
        record(live.sourceFormat, live.targetFormat, live.sourceText, 'live');
        return;
      }
      const dest = decideConversionResultDest({
        originTabId: origin.tabId,
        liveTabId: live.activeSessionTabId,
        writeSource: origin.sourceFormat,
        writeTarget: origin.targetFormat,
        liveSource: live.sourceFormat,
      });
      lastOutputDestRef.current = dest;
      if (dest === 'tab') {
        patchSessionTabContent(origin.tabId, (tab) =>
          applyResultToBuffers(tab, origin.sourceFormat, origin.targetFormat, next)
        );
        record(origin.sourceFormat, origin.targetFormat, origin.sourceText, dest);
        showSnackbar(t('snack.convertAppliedOtherTab'));
        return;
      }
      if (dest === 'skip') {
        showSnackbar(t('snack.convertResultSkipped'));
        return;
      }
      writeResultBuffer(origin.sourceFormat, origin.targetFormat, next, {
        setAdocInput,
        setMdOutput,
        setOtherOutput,
      });
      record(origin.sourceFormat, origin.targetFormat, origin.sourceText, dest);
    },
    [
      userSettings.profile,
      patchSessionTabContent,
      showSnackbar,
      t,
      recordConversionHistory,
      liveEditorRef,
      setAdocInput,
      setMdOutput,
      setOtherOutput,
    ]
  );

  const startGuardedConvert = useCallback(
    (input: {
      sourceText: string;
      from: FormatType;
      to: FormatType;
      confirmationToken: string | null;
      useDeferredOutput: boolean;
      clearPendingToken: boolean;
    }) => {
      const opts = applyTocAndProfile(conversionOptions, userSettings);
      conversionAbortRef.current?.abort();
      const abortController = new AbortController();
      conversionAbortRef.current = abortController;
      const attemptId = activeAttemptIdRef.current + 1;
      activeAttemptIdRef.current = attemptId;
      setLastAttemptId(attemptId);
      const isActiveAttempt = () => activeAttemptIdRef.current === attemptId;
      const guardedSetStatus = (value: string) => {
        if (isActiveAttempt()) setStatus(value);
      };
      const guardedSetOutput = (value: string) => {
        if (!isActiveAttempt()) return;
        if (input.useDeferredOutput && value.length >= 100_000) {
          startTransition(() => deliverConversionOutput(value));
        } else {
          deliverConversionOutput(value);
        }
      };
      const guardedSetLoading = (value: boolean) => {
        if (isActiveAttempt()) setLoading(value);
      };
      const guardedSetNotification = (value: Notify | null) => {
        if (isActiveAttempt()) setNotification(value);
      };
      const guardedSetShowConversionErrorModal = (value: boolean) => {
        if (isActiveAttempt()) setShowConversionErrorModal(value);
      };
      const guardedSetConversionErrorMessage = (value: string) => {
        if (isActiveAttempt()) setConversionErrorMessage(value);
      };
      const guardedSetLastBackendConversionResult = (value: unknown) => {
        if (isActiveAttempt()) setLastBackendConversionResult(value);
      };
      const guardedSetConversionUiState = (value: ConversionUiState) => {
        if (!isActiveAttempt()) return;
        if (value === 'success' && lastOutputDestRef.current && lastOutputDestRef.current !== 'live') {
          setConversionUiState('idle');
          setJustConverted(false);
          if (input.clearPendingToken) {
            setConfirmationToken(null);
            setPendingConversion(null);
          }
          return;
        }
        if (value === 'success') setJustConverted(true);
        if (input.clearPendingToken && (value === 'success' || value === 'error')) {
          setConfirmationToken(null);
          setPendingConversion(null);
        }
        setConversionUiState(value);
      };
      convertText(
        input.sourceText,
        input.from,
        input.to,
        guardedSetStatus,
        guardedSetOutput,
        guardedSetLoading,
        guardedSetNotification,
        opts,
        input.confirmationToken,
        guardedSetShowConversionErrorModal,
        guardedSetConversionErrorMessage,
        guardedSetLastBackendConversionResult,
        guardedSetConversionUiState,
        conversionTimeoutMs,
        abortController.signal,
        {
          emptyInput: t('convert.emptyInput'),
          sameFormat: t('convert.sameFormat'),
          running: t('convert.running'),
          error: t('convert.error'),
          success: t('convert.successMark'),
          successWarnings: (count: number) => t('convert.successWarnings', { count }),
          timeout: t('convert.timeout'),
        }
      );
    },
    [
      conversionOptions,
      userSettings,
      conversionAbortRef,
      conversionTimeoutMs,
      t,
      deliverConversionOutput,
      setStatus,
      setLoading,
      setNotification,
      setShowConversionErrorModal,
      setConversionErrorMessage,
      setLastBackendConversionResult,
      setConversionUiState,
      setJustConverted,
    ]
  );

  const requestConversionConfirmation = useCallback(
    async (snap?: ConvertRequestSnap | null) => {
      if (loading || folderBatchRunning || isEditingResult) {
        return;
      }
      const from = snap?.sourceFormat ?? sourceFormat;
      const to = snap?.targetFormat ?? targetFormat;
      const sourceText = snap?.sourceText ?? (from === 'markdown' ? mdOutput : adocInput);
      const tabId = snap?.tabId ?? liveEditorRef.current.activeSessionTabId;

      if (!sourceText.trim()) {
        setStatus(t('convert.emptyInput'));
        setNotification({
          message: 'Veuillez entrer du texte à convertir',
          type: 'error',
          visible: true,
        });
        return;
      }

      const sourceSizeBytes = new Blob([sourceText]).size;
      if (sourceSizeBytes > maxSourceSizeMb * 1024 * 1024) {
        setStatus(t('snack.tooLarge', { mb: maxSourceSizeMb }));
        setNotification({
          message: `Le document dépasse la capacité de cette machine (${maxSourceSizeMb} Mo). Réduisez le contenu ou divisez le fichier.`,
          type: 'error',
          visible: true,
        });
        return;
      }

      if (from === to) {
        setStatus(t('convert.sameFormat'));
        setNotification({
          message: 'Les formats source et destination sont identiques',
          type: 'error',
          visible: true,
        });
        return;
      }

      try {
        setLoading(true);
        const contentSize = new Blob([sourceText]).size;
        const token = await requestConfirmationToken(from, to, contentSize);
        setConfirmationToken(token);
        setPendingConversion({
          fromFormat: from,
          toFormat: to,
          token,
          sourceText,
          tabId,
        });
        setShowConversionModal(true);
        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        setStatus(t('snack.convertError', { message: error.message }));
        setNotification({
          message: `Erreur lors de la demande de confirmation: ${error.message}`,
          type: 'error',
          visible: true,
        });
      }
    },
    [
      loading,
      folderBatchRunning,
      isEditingResult,
      sourceFormat,
      targetFormat,
      adocInput,
      mdOutput,
      setNotification,
      t,
      maxSourceSizeMb,
      liveEditorRef,
      setStatus,
      setLoading,
    ]
  );

  const confirmAndConvert = useCallback(() => {
    if (!confirmationToken || !pendingConversion) {
      setNotification({
        message: 'Error: Missing confirmation token',
        type: 'error',
        visible: true,
      });
      setShowConversionModal(false);
      return;
    }

    setShowConversionModal(false);

    const fromFormat = pendingConversion.fromFormat;
    const toFormat = pendingConversion.toFormat;
    const sourceText = pendingConversion.sourceText;
    beginConvertAttempt(fromFormat, toFormat, sourceText, pendingConversion.tabId);
    startGuardedConvert({
      sourceText,
      from: fromFormat,
      to: toFormat,
      confirmationToken,
      useDeferredOutput: false,
      clearPendingToken: true,
    });
  }, [confirmationToken, pendingConversion, beginConvertAttempt, startGuardedConvert, setNotification]);

  useEffect(() => {
    if (!loading && justConverted) {
      const timer = setTimeout(() => {
        const sourceContent = sourceFormat === 'markdown' ? mdOutput : adocInput;
        const liveKey = sourceAutoConvertKey(sourceFormat, targetFormat, sourceContent);
        if (shouldMarkTabCleanAfterConvert(liveKey, convertSnapshotKeyRef.current)) {
          setSourceModified(false);
        }
        setResultModified(false);
        setJustConverted(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    loading,
    justConverted,
    sourceFormat,
    targetFormat,
    adocInput,
    mdOutput,
    convertSnapshotKeyRef,
    setSourceModified,
    setResultModified,
    setJustConverted,
  ]);

  const handleConvert = useCallback(
    (opts?: { skipConfirm?: boolean }) => {
      if (loading || folderBatchRunning) {
        return;
      }
      if (isEditingResult) {
        setStatus(t('snack.saveEditFirst'));
        setNotification({
          message: "Sauvegardez ou annulez l'édition du résultat avant de convertir",
          type: 'error',
          visible: true,
        });
        return;
      }

      if (!isSupportedUiConversion(sourceFormat, targetFormat)) {
        setStatus(t('snack.pairUnavailable'));
        setNotification({
          message: SUPPORTED_CONVERSION_HINT,
          type: 'error',
          visible: true,
        });
        return;
      }

      const liveSourceText = sourceFormat === 'markdown' ? mdOutput : adocInput;
      if (userSettings.conversion.confirmBeforeConversion && !opts?.skipConfirm) {
        pendingConfirmConvertRef.current = {
          tabId: liveEditorRef.current.activeSessionTabId,
          sourceText: liveSourceText,
          sourceFormat,
          targetFormat,
        };
        setShowConfirmConvertModal(true);
        return;
      }

      const snap = opts?.skipConfirm ? pendingConfirmConvertRef.current : null;
      pendingConfirmConvertRef.current = null;
      const request = resolveConvertRequestSnap(snap, {
        tabId: liveEditorRef.current.activeSessionTabId,
        sourceText: liveSourceText,
        sourceFormat,
        targetFormat,
      });
      const from = request.sourceFormat;
      const to = request.targetFormat;
      const sourceText = request.sourceText;
      const originTabId = request.tabId;

      const needsToken = conversionNeedsConfirmationToken(from, to);

      if (needsToken) {
        requestConversionConfirmation(request);
      } else {
        if (!sourceText.trim()) {
          setStatus(t('convert.emptyInput'));
          setNotification({
            message: 'Veuillez entrer du texte à convertir',
            type: 'error',
            visible: true,
          });
          return;
        }

        const sourceSizeBytes = new Blob([sourceText]).size;
        if (sourceSizeBytes > maxSourceSizeMb * 1024 * 1024) {
          setStatus(t('snack.tooLarge', { mb: maxSourceSizeMb }));
          setNotification({
            message: `Le document dépasse la capacité de cette machine (${maxSourceSizeMb} Mo). Réduisez le contenu ou divisez le fichier.`,
            type: 'error',
            visible: true,
          });
          return;
        }

        if (from === to) {
          setStatus(t('convert.sameFormat'));
          setNotification({
            message: 'Les formats source et destination sont identiques',
            type: 'error',
            visible: true,
          });
          return;
        }

        beginConvertAttempt(from, to, sourceText, originTabId);
        startGuardedConvert({
          sourceText,
          from,
          to,
          confirmationToken: null,
          useDeferredOutput: true,
          clearPendingToken: false,
        });
      }
    },
    [
      loading,
      folderBatchRunning,
      requestConversionConfirmation,
      sourceFormat,
      targetFormat,
      adocInput,
      mdOutput,
      userSettings,
      isEditingResult,
      t,
      maxSourceSizeMb,
      liveEditorRef,
      beginConvertAttempt,
      startGuardedConvert,
      setStatus,
      setNotification,
    ]
  );

  const closeConfirmConvert = useCallback(() => {
    setShowConfirmConvertModal(false);
    pendingConfirmConvertRef.current = null;
  }, []);

  const acceptConfirmConvert = useCallback(() => {
    setShowConfirmConvertModal(false);
    handleConvert({ skipConfirm: true });
  }, [handleConvert]);

  const closeConversionConfirm = useCallback(() => {
    setShowConversionModal(false);
    setConfirmationToken(null);
    setPendingConversion(null);
  }, []);

  const cancelConversionConfirm = useCallback(() => {
    setConfirmationToken(null);
    setPendingConversion(null);
  }, []);

  const loadingHere =
    loading &&
    (!convertOriginRef.current || convertOriginRef.current.tabId === activeSessionTabId);

  return {
    handleConvert,
    confirmAndConvert,
    loadingHere,
    showConfirmConvertModal,
    showConversionModal,
    confirmationToken,
    pendingConversion,
    closeConfirmConvert,
    acceptConfirmConvert,
    closeConversionConfirm,
    cancelConversionConfirm,
  };
}
