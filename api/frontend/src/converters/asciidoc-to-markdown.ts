import { API_BASE } from './api';

type ConversionResultSuccess = {
  success: true;
  conversionId: string;
  converter: string;
  pipeline: any[];
  inputFormat: string;
  outputFormat: string;
  inputFile: any;
  outputFile: any;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  warnings: any[];
  logs: any[];
  error: null;
  meta: Record<string, unknown>;
};

type ConversionResultFailure = {
  success: false;
  conversionId: string;
  converter: string;
  pipeline: any[];
  inputFormat: string;
  outputFormat: string;
  inputFile: any;
  outputFile: any | null;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  warnings: any[];
  logs: any[];
  error: {
    code: string;
    message: string;
    details?: any;
    recoverable?: boolean;
  };
  meta: Record<string, unknown>;
};

function normalizeArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function normalizeMeta(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// Frontend-local success builder mirroring standardized contract shape.
function createSuccessResult(payload: any): ConversionResultSuccess {
  const input = payload || {};
  return {
    success: true,
    conversionId: input.conversionId,
    converter: input.converter,
    pipeline: normalizeArray(input.pipeline),
    inputFormat: input.inputFormat,
    outputFormat: input.outputFormat,
    inputFile: input.inputFile,
    outputFile: input.outputFile,
    durationMs: input.durationMs,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    warnings: normalizeArray(input.warnings),
    logs: normalizeArray(input.logs),
    error: null,
    meta: normalizeMeta(input.meta),
  };
}

function normalizeError(value: unknown): {
  code: string;
  message: string;
  details?: any;
  recoverable?: boolean;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { code: 'INTERNAL_ERROR', message: 'Unknown error' };
  }
  const err = value as any;
  const code = typeof err.code === 'string' && err.code.length > 0 ? err.code : 'INTERNAL_ERROR';
  const message = typeof err.message === 'string' && err.message.length > 0 ? err.message : 'Unknown error';
  const details = err.details;
  const recoverable = typeof err.recoverable === 'boolean' ? err.recoverable : undefined;
  return { code, message, details, recoverable };
}

// Frontend-local failure builder mirroring standardized contract shape.
function createFailureResult(payload: any): ConversionResultFailure {
  const input = payload || {};
  return {
    success: false,
    conversionId: input.conversionId,
    converter: input.converter,
    pipeline: normalizeArray(input.pipeline),
    inputFormat: input.inputFormat,
    outputFormat: input.outputFormat,
    inputFile: input.inputFile,
    outputFile: input.outputFile ?? null,
    durationMs: input.durationMs,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    warnings: normalizeArray(input.warnings),
    logs: normalizeArray(input.logs),
    error: normalizeError(input.error),
    meta: normalizeMeta(input.meta),
  };
}

function shouldShowConversionErrorModalForCode(backendCode: string) {
  return (
    backendCode === 'CONVERSION_FAILED' ||
    backendCode === 'OUTPUT_NOT_CREATED' ||
    backendCode === 'OUTPUT_INVALID' ||
    backendCode === 'OUTPUT_IS_INPUT'
  );
}

/**
 * Converts AsciiDoc content to Markdown
 * 
 * @param text - AsciiDoc content to convert
 * @param setStatus - Function to update status message
 * @param setOutput - Function to set Markdown result
 * @param setLoading - Function to manage loading state
 * @param setNotification - Function to display notifications
 * 
 * ENDPOINT USED: POST /to-markdown
 * ENGINE: downdoc (native JavaScript library)
 * TIMEOUT: 30 seconds
 * 
 * ERROR HANDLING:
 * - Timeout: Explicit message if conversion exceeds 30s
 * - Network error: Backend connection verification
 * - HTTP error: Display error code and message
 */
export async function convertAsciiDocToMarkdown(
  text: string,
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void,
  setShowErrorModal?: (show: boolean) => void,
  setErrorMessage?: (message: string) => void,
  setBackendConversionResult?: (result: any | null) => void,
  setConversionUiState?: (state: 'idle' | 'loading' | 'success' | 'error') => void
) {
  const attemptStartedAtMs = Date.now();
  if (!text.trim()) {
    setStatus("Veuillez entrer du texte à convertir");
    setNotification(null);
    if (setConversionUiState) setConversionUiState('idle');
    const nowIso = new Date().toISOString();
    return createFailureResult({
      conversionId: 'ui-precheck',
      converter: 'ui-wrapper',
      pipeline: [],
      inputFormat: 'asciidoc',
      outputFormat: 'markdown',
      inputFile: { kind: 'in-memory', bytes: text.length },
      outputFile: null,
      startedAt: nowIso,
      finishedAt: nowIso,
      durationMs: 0,
      warnings: [],
      logs: [],
      error: { code: 'EMPTY_INPUT', message: 'Empty input (client pre-check)', recoverable: true },
      meta: { uiWrapper: 'asciidoc-to-markdown', stage: 'precheck' },
    });
  }

  setStatus("Conversion en cours...");
  setNotification(null);
  if (setShowErrorModal) setShowErrorModal(false);
  if (setErrorMessage) setErrorMessage("");
  if (setBackendConversionResult) setBackendConversionResult(null);
  setOutput("");
  setLoading(true);
  if (setConversionUiState) setConversionUiState('loading');

  try {
    const startedAtIso = new Date(attemptStartedAtMs).toISOString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout

    const res = await fetch(`${API_BASE}/api/to-markdown`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorText = "";
      let errorDetail = "";
      let parsedFailureBody: any = null;
      
      try {
        // Try to parse as JSON first (backend returns JSON with 'detail' field)
        const errorJson = await res.json().catch(() => null);
        parsedFailureBody = errorJson;
        if (errorJson && errorJson.detail) {
          errorDetail = errorJson.detail;
          errorText = errorJson.detail;
        } else {
          // Fallback to text if not JSON
          errorText = await res.text().catch(() => "");
        }
      } catch {
        // If both fail, use empty string
        errorText = await res.text().catch(() => "");
      }

      // Backend standardized failure at root (same shape as generic-converter contract path).
      const structuredFailure =
        parsedFailureBody &&
        typeof parsedFailureBody === 'object' &&
        parsedFailureBody.success === false &&
        parsedFailureBody.error &&
        typeof parsedFailureBody.error === 'object'
          ? parsedFailureBody
          : null;

      if (structuredFailure) {
        setOutput("");
        if (setBackendConversionResult) setBackendConversionResult(structuredFailure);
        const backendError = structuredFailure.error || {};
        const backendMessage =
          typeof backendError.message === 'string' && backendError.message.trim().length > 0
            ? backendError.message
            : (errorDetail || errorText || `HTTP Error ${res.status}`);
        const backendCode = typeof backendError.code === 'string' ? backendError.code : '';

        const shouldShowModal =
          shouldShowConversionErrorModalForCode(backendCode);

        if (shouldShowModal && setShowErrorModal && setErrorMessage) {
          setShowErrorModal(true);
          setErrorMessage(backendMessage);
        }

        setStatus("Erreur de conversion");
        setNotification({
          message: `Erreur de conversion${backendCode ? ` (${backendCode})` : ''}`,
          type: 'error',
          visible: true
        });
        if (setConversionUiState) setConversionUiState('error');
        return createFailureResult(structuredFailure);
      }
      
      const errorMessage = `Erreur HTTP ${res.status}${errorText ? `: ${errorText}` : ""}`;
      
      // Check if this is a conversion failure error (output contains AsciiDoc instead of Markdown)
      const errorMessageToCheck = errorDetail || errorText;
      if (errorMessageToCheck && (
        errorMessageToCheck.includes('output file contains AsciiDoc instead of Markdown') ||
        errorMessageToCheck.includes('output appears to be AsciiDoc instead of Markdown') ||
        errorMessageToCheck.includes('Conversion failed: output file contains AsciiDoc') ||
        errorMessageToCheck.includes('Conversion error: output appears to be AsciiDoc') ||
        errorMessageToCheck.includes('output is identical to processed input') ||
        errorMessageToCheck.includes('output is identical to input') ||
        errorMessageToCheck.includes('Conversion error: output is identical')
      )) {
        const modalMessage = 'La conversion a échoué. Le résultat contient encore de l\'AsciiDoc au lieu du Markdown. Veuillez modifier la source et réessayer la conversion.';
        setStatus("Erreur de conversion");
        setNotification({
          message: "Erreur de conversion - Veuillez modifier la source",
          type: 'error',
          visible: true
        });
        setOutput("");
        const finishedAtMs = Date.now();
        const backendFailure =
          parsedFailureBody && typeof parsedFailureBody === 'object'
            ? ((parsedFailureBody as any).conversionResult ?? parsedFailureBody)
            : null;
        const structured =
          backendFailure && typeof backendFailure === 'object' && (backendFailure as any).success === false
            ? backendFailure
            : null;
        const backendCode =
          structured && structured.error && typeof structured.error === 'object' && typeof structured.error.code === 'string'
            ? structured.error.code
            : '';
        if (setShowErrorModal && setErrorMessage) {
          if (shouldShowConversionErrorModalForCode(backendCode)) {
            setShowErrorModal(true);
            setErrorMessage(
              typeof structured?.error?.message === 'string' && structured.error.message.trim().length > 0
                ? structured.error.message
                : modalMessage
            );
          } else if (!backendCode) {
            setShowErrorModal(true);
            setErrorMessage(modalMessage);
          }
        }
        const failureResult = createFailureResult({
          conversionId: structured?.conversionId ?? 'ui-http',
          converter: structured?.converter ?? 'ui-wrapper',
          pipeline: structured?.pipeline ?? [],
          inputFormat: structured?.inputFormat ?? 'asciidoc',
          outputFormat: structured?.outputFormat ?? 'markdown',
          inputFile: structured?.inputFile ?? { kind: 'in-memory', bytes: text.length },
          outputFile: structured?.outputFile ?? null,
          startedAt: structured?.startedAt ?? startedAtIso,
          finishedAt: structured?.finishedAt ?? new Date(finishedAtMs).toISOString(),
          durationMs: typeof structured?.durationMs === 'number' ? structured.durationMs : finishedAtMs - attemptStartedAtMs,
          warnings: structured?.warnings ?? [],
          logs: structured?.logs ?? [],
          error: structured?.error ?? {
            code: 'OUTPUT_INVALID',
            message: errorMessageToCheck,
            details: { stage: 'output-validation', reason: 'OUTPUT_APPEARS_ASCII_OR_UNCHANGED' },
            recoverable: true,
          },
          meta: structured?.meta ?? { uiWrapper: 'asciidoc-to-markdown', stage: 'http-non-ok-modal' },
        });
        if (setBackendConversionResult) setBackendConversionResult(failureResult);
        if (setConversionUiState) setConversionUiState('error');
        return failureResult;
      }
      
      const finishedAtMs = Date.now();
      const finishedAtIso = new Date(finishedAtMs).toISOString();
      const backendFailure =
        parsedFailureBody && typeof parsedFailureBody === 'object'
          ? ((parsedFailureBody as any).conversionResult ?? parsedFailureBody)
          : null;
      const structured =
        backendFailure && typeof backendFailure === 'object' && (backendFailure as any).success === false
          ? backendFailure
          : null;

      // Preserve backend standardized failure when available; otherwise build a minimal standardized failure.
      const standardizedFailure = createFailureResult({
        conversionId: structured?.conversionId ?? 'ui-http',
        converter: structured?.converter ?? 'ui-wrapper',
        pipeline: structured?.pipeline ?? [],
        inputFormat: structured?.inputFormat ?? 'asciidoc',
        outputFormat: structured?.outputFormat ?? 'markdown',
        inputFile: structured?.inputFile ?? { kind: 'in-memory', bytes: text.length },
        outputFile: structured?.outputFile ?? null,
        startedAt: structured?.startedAt ?? startedAtIso,
        finishedAt: structured?.finishedAt ?? finishedAtIso,
        durationMs: typeof structured?.durationMs === 'number' ? structured.durationMs : finishedAtMs - attemptStartedAtMs,
        warnings: structured?.warnings ?? [],
        logs: structured?.logs ?? [],
        error: structured?.error ?? {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
          details: { httpStatus: res.status, detail: errorDetail || undefined },
          recoverable: false,
        },
        meta: structured?.meta ?? { uiWrapper: 'asciidoc-to-markdown', stage: 'http-non-ok' },
      });

      // Harmonized failure exit: return structured failure directly (no throw/catch detour).
      setOutput("");
      setStatus(`Erreur lors de l'appel à l'API : ${errorMessage}`);
      setNotification({
        message: `Erreur lors de l'appel à l'API : ${errorMessage}`,
        type: 'error',
        visible: true
      });
      if (setBackendConversionResult) setBackendConversionResult(standardizedFailure);
      if (setConversionUiState) setConversionUiState('error');
      return standardizedFailure;
    }

    const data = await res.json();

    // Standardized success semantics: consume backend conversionResult and re-emit a
    // fully-shaped standardized success ConversionResult for this attempt.
    const backendConversionResult =
      data && typeof data === 'object' ? (data as any).conversionResult : null;
    if (!backendConversionResult || typeof backendConversionResult !== 'object') {
      setOutput("");
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const msg = 'Invalid conversion response: missing conversionResult';
      const failure = createFailureResult({
        conversionId: 'ui-invalid-success',
        converter: 'ui-wrapper',
        pipeline: [],
        inputFormat: 'asciidoc',
        outputFormat: 'markdown',
        inputFile: { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: startedAtIso,
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: [],
        logs: [],
        error: { code: 'INTERNAL_ERROR', message: msg, details: { stage: 'success-parse' }, recoverable: false },
        meta: { uiWrapper: 'asciidoc-to-markdown', stage: 'success-parse' },
      });
      const uiMsg = `Erreur lors de l'appel à l'API : ${msg}`;
      setStatus(uiMsg);
      setNotification({ message: uiMsg, type: 'error', visible: true });
      if (setBackendConversionResult) setBackendConversionResult(failure);
      if (setConversionUiState) setConversionUiState('error');
      return failure;
    }
    if ((backendConversionResult as any).success !== true) {
      setOutput("");
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const msg = 'Invalid conversion response: conversionResult.success is not true';
      const failure = createFailureResult({
        conversionId: (backendConversionResult as any).conversionId ?? 'ui-invalid-success',
        converter: (backendConversionResult as any).converter ?? 'ui-wrapper',
        pipeline: (backendConversionResult as any).pipeline ?? [],
        inputFormat: (backendConversionResult as any).inputFormat ?? 'asciidoc',
        outputFormat: (backendConversionResult as any).outputFormat ?? 'markdown',
        inputFile: (backendConversionResult as any).inputFile ?? { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: (backendConversionResult as any).startedAt ?? startedAtIso,
        finishedAt: (backendConversionResult as any).finishedAt ?? nowIso,
        durationMs:
          typeof (backendConversionResult as any).durationMs === 'number'
            ? (backendConversionResult as any).durationMs
            : finishedAtMs - attemptStartedAtMs,
        warnings: (backendConversionResult as any).warnings ?? [],
        logs: (backendConversionResult as any).logs ?? [],
        error: (backendConversionResult as any).error ?? {
          code: 'INTERNAL_ERROR',
          message: msg,
          details: { stage: 'success-parse' },
          recoverable: false,
        },
        meta: (backendConversionResult as any).meta ?? { uiWrapper: 'asciidoc-to-markdown', stage: 'success-parse' },
      });
      const uiMsg = `Erreur lors de l'appel à l'API : ${msg}`;
      setStatus(uiMsg);
      setNotification({ message: uiMsg, type: 'error', visible: true });
      if (setBackendConversionResult) setBackendConversionResult(failure);
      if (setConversionUiState) setConversionUiState('error');
      return failure;
    }
    const conversionResult = createSuccessResult({
      conversionId: (backendConversionResult as any).conversionId,
      converter: (backendConversionResult as any).converter,
      pipeline: (backendConversionResult as any).pipeline,
      inputFormat: (backendConversionResult as any).inputFormat,
      outputFormat: (backendConversionResult as any).outputFormat,
      inputFile: (backendConversionResult as any).inputFile,
      outputFile: (backendConversionResult as any).outputFile,
      durationMs: (backendConversionResult as any).durationMs,
      startedAt: (backendConversionResult as any).startedAt,
      finishedAt: (backendConversionResult as any).finishedAt,
      warnings: (backendConversionResult as any).warnings,
      logs: (backendConversionResult as any).logs,
      meta: (backendConversionResult as any).meta,
    });

    if (typeof data.markdown !== 'string') {
      setOutput("");
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const msg = 'Invalid conversion response: missing markdown output';
      const failure = createFailureResult({
        conversionId: (backendConversionResult as any).conversionId,
        converter: (backendConversionResult as any).converter ?? 'ui-wrapper',
        pipeline: (backendConversionResult as any).pipeline ?? [],
        inputFormat: (backendConversionResult as any).inputFormat ?? 'asciidoc',
        outputFormat: (backendConversionResult as any).outputFormat ?? 'markdown',
        inputFile: (backendConversionResult as any).inputFile ?? { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: (backendConversionResult as any).startedAt ?? startedAtIso,
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: (backendConversionResult as any).warnings ?? [],
        logs: (backendConversionResult as any).logs ?? [],
        error: { code: 'INTERNAL_ERROR', message: msg, details: { stage: 'success-parse' }, recoverable: false },
        meta: (backendConversionResult as any).meta ?? { uiWrapper: 'asciidoc-to-markdown', stage: 'success-parse' },
      });
      const uiMsg = `Erreur lors de l'appel à l'API : ${msg}`;
      setStatus(uiMsg);
      setNotification({ message: uiMsg, type: 'error', visible: true });
      if (setBackendConversionResult) setBackendConversionResult(failure);
      if (setConversionUiState) setConversionUiState('error');
      return failure;
    }

    if (setBackendConversionResult) setBackendConversionResult(conversionResult);
    setOutput(data.markdown);
    setStatus("Conversion réussie ✔");
    setNotification({
      message: "Conversion réussie ✔",
      type: 'success',
      visible: true
    });
    if (setConversionUiState) setConversionUiState('success');
    return conversionResult;
  } catch (e: any) {
    setOutput("");
    if (e.name === "AbortError") {
      const timeoutMessage = "Erreur : Timeout - La conversion prend trop de temps. Le fichier est peut-être trop volumineux.";
      setStatus(timeoutMessage);
      setNotification({
        message: timeoutMessage,
        type: 'error',
        visible: true
      });
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const fr = createFailureResult({
        conversionId: 'ui-timeout',
        converter: 'ui-wrapper',
        pipeline: [],
        inputFormat: 'asciidoc',
        outputFormat: 'markdown',
        inputFile: { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: new Date(attemptStartedAtMs).toISOString(),
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: [],
        logs: [],
        error: { code: 'INTERNAL_ERROR', message: timeoutMessage, details: { kind: 'AbortError' }, recoverable: true },
        meta: { uiWrapper: 'asciidoc-to-markdown', stage: 'timeout' },
      });
      if (setBackendConversionResult) setBackendConversionResult(fr);
      if (setConversionUiState) setConversionUiState('error');
      return fr;
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      const networkMessage = `Erreur réseau : Impossible de contacter l'API à ${API_BASE}. Vérifiez que le serveur backend est démarré.`;
      setStatus(networkMessage);
      setNotification({
        message: networkMessage,
        type: 'error',
        visible: true
      });
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const fr = createFailureResult({
        conversionId: 'ui-network',
        converter: 'ui-wrapper',
        pipeline: [],
        inputFormat: 'asciidoc',
        outputFormat: 'markdown',
        inputFile: { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: new Date(attemptStartedAtMs).toISOString(),
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: [],
        logs: [],
        error: { code: 'INTERNAL_ERROR', message: networkMessage, details: { kind: 'NetworkError' }, recoverable: true },
        meta: { uiWrapper: 'asciidoc-to-markdown', stage: 'network' },
      });
      if (setBackendConversionResult) setBackendConversionResult(fr);
      if (setConversionUiState) setConversionUiState('error');
      return fr;
    } else {
      const errorMessage = `Erreur lors de l'appel à l'API : ${e.message ?? e}`;
      setStatus(errorMessage);
      setNotification({
        message: errorMessage,
        type: 'error',
        visible: true
      });

      if (e && typeof e === 'object' && (e as any).conversionResult) {
        const cr = (e as any).conversionResult as ConversionResultFailure;
        if (setBackendConversionResult) setBackendConversionResult(cr);
        if (setConversionUiState) setConversionUiState('error');
        return cr;
      }

      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const fr = createFailureResult({
        conversionId: 'ui-error',
        converter: 'ui-wrapper',
        pipeline: [],
        inputFormat: 'asciidoc',
        outputFormat: 'markdown',
        inputFile: { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: new Date(attemptStartedAtMs).toISOString(),
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: [],
        logs: [],
        error: { code: 'INTERNAL_ERROR', message: errorMessage, details: { original: e?.message ?? String(e) }, recoverable: false },
        meta: { uiWrapper: 'asciidoc-to-markdown', stage: 'catch' },
      });
      if (setBackendConversionResult) setBackendConversionResult(fr);
      if (setConversionUiState) setConversionUiState('error');
      return fr;
    }
  } finally {
    setLoading(false);
  }
}
