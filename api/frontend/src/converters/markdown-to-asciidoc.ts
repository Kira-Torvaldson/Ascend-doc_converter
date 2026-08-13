import { API_BASE, buildConversionFetchHeaders } from './api';
import { formatConversionErrorForUi } from './error-code-messages';

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

/**
 * Converts Markdown content to AsciiDoc
 *
 * @param text - Markdown content to convert
 * @param setStatus - Function to update status message
 * @param setOutput - Function to set AsciiDoc result
 * @param setLoading - Function to manage loading state
 * @param setNotification - Function to display notifications
 * @param setConversionMode - Optional function to update conversion mode
 *
 * ENDPOINT USED: POST /to-asciidoc
 * ENGINE: Pandoc (external tool, must be installed)
 * TIMEOUT: 30 seconds
 *
 * ERROR HANDLING:
 * - Timeout: Explicit message if conversion exceeds 30s
 * - Network error: Backend connection verification
 * - HTTP error: Structured ConversionResult when JSON body is available (error.code preserved)
 */
export async function convertMarkdownToAsciiDoc(
  text: string,
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void,
  setConversionMode?: (mode: 'adoc-to-md' | 'md-to-adoc') => void,
  setBackendConversionResult?: (result: any | null) => void,
  setConversionUiState?: (state: 'idle' | 'loading' | 'success' | 'error') => void
): Promise<ConversionResultSuccess | ConversionResultFailure> {
  const attemptStartedAtMs = Date.now();
  if (!text.trim()) {
    setNotification(null);
    setStatus('Veuillez entrer du texte à convertir');
    if (setConversionUiState) setConversionUiState('idle');
    const nowIso = new Date().toISOString();
    return createFailureResult({
      conversionId: 'ui-precheck',
      converter: 'ui-wrapper',
      pipeline: [],
      inputFormat: 'markdown',
      outputFormat: 'asciidoc',
      inputFile: { kind: 'in-memory', bytes: text.length },
      outputFile: null,
      startedAt: nowIso,
      finishedAt: nowIso,
      durationMs: 0,
      warnings: [],
      logs: [],
      error: { code: 'EMPTY_INPUT', message: 'Empty input (client pre-check)', recoverable: true },
      meta: { uiWrapper: 'markdown-to-asciidoc', stage: 'precheck' },
    });
  }

  setStatus('Conversion en cours...');
  setNotification(null);
  if (setBackendConversionResult) setBackendConversionResult(null);
  setLoading(true);
  if (setConversionMode) {
    setConversionMode('md-to-adoc');
  }
  if (setConversionUiState) setConversionUiState('loading');

  try {
    const startedAtIso = new Date(attemptStartedAtMs).toISOString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${API_BASE}/api/to-asciidoc`, {
      method: 'POST',
      headers: buildConversionFetchHeaders(),
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const rawBody = await res.text().catch(() => '');
      let errorText = rawBody;
      let errorDetail = '';
      let parsedFailureBody: any = null;
      try {
        parsedFailureBody = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        parsedFailureBody = null;
      }
      if (parsedFailureBody && typeof parsedFailureBody === 'object' && parsedFailureBody.detail) {
        errorDetail = String(parsedFailureBody.detail);
        errorText = errorDetail;
      }

      const structuredFailure =
        parsedFailureBody &&
        typeof parsedFailureBody === 'object' &&
        parsedFailureBody.success === false &&
        parsedFailureBody.error &&
        typeof parsedFailureBody.error === 'object'
          ? parsedFailureBody
          : null;

      if (structuredFailure) {
        const normalizedFromBackend = createFailureResult(structuredFailure);
        if (setBackendConversionResult) setBackendConversionResult(normalizedFromBackend);
        const backendError = structuredFailure.error || {};
        const backendCode = typeof backendError.code === 'string' ? backendError.code : '';

        setStatus('Erreur de conversion');
        const uiErrorMessage = formatConversionErrorForUi(
          backendCode,
          `Erreur de conversion${backendCode ? ` (${backendCode})` : ''}`,
          typeof backendError.hint === 'string' ? backendError.hint : null
        );
        setNotification({
          message: uiErrorMessage,
          type: 'error',
          visible: true,
        });
        if (setConversionUiState) setConversionUiState('error');
        return normalizedFromBackend;
      }

      const errorMessage = `Erreur HTTP ${res.status}${errorText ? `: ${errorText}` : ''}`;
      const finishedAtMs = Date.now();
      const finishedAtIso = new Date(finishedAtMs).toISOString();
      const backendFailure =
        parsedFailureBody && typeof parsedFailureBody === 'object'
          ? (parsedFailureBody as any).conversionResult ?? parsedFailureBody
          : null;
      const structured =
        backendFailure && typeof backendFailure === 'object' && (backendFailure as any).success === false
          ? backendFailure
          : null;

      const standardizedFailure = createFailureResult({
        conversionId: structured?.conversionId ?? 'ui-http',
        converter: structured?.converter ?? 'ui-wrapper',
        pipeline: structured?.pipeline ?? [],
        inputFormat: structured?.inputFormat ?? 'markdown',
        outputFormat: structured?.outputFormat ?? 'asciidoc',
        inputFile: structured?.inputFile ?? { kind: 'in-memory', bytes: text.length },
        outputFile: structured?.outputFile ?? null,
        startedAt: structured?.startedAt ?? startedAtIso,
        finishedAt: structured?.finishedAt ?? finishedAtIso,
        durationMs:
          typeof structured?.durationMs === 'number' ? structured.durationMs : finishedAtMs - attemptStartedAtMs,
        warnings: structured?.warnings ?? [],
        logs: structured?.logs ?? [],
        error: structured?.error ?? {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
          details: { httpStatus: res.status, detail: errorDetail || undefined },
          recoverable: false,
        },
        meta: structured?.meta ?? { uiWrapper: 'markdown-to-asciidoc', stage: 'http-non-ok' },
      });

      setStatus(`Erreur lors de l'appel à l'API : ${errorMessage}`);
      setNotification({
        message: `Erreur lors de l'appel à l'API : ${errorMessage}`,
        type: 'error',
        visible: true,
      });
      if (setBackendConversionResult) setBackendConversionResult(standardizedFailure);
      if (setConversionUiState) setConversionUiState('error');
      return standardizedFailure;
    }

    const data = await res.json();

    const backendConversionResult =
      data && typeof data === 'object' ? (data as any).conversionResult : null;
    if (!backendConversionResult || typeof backendConversionResult !== 'object') {
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const msg = 'Invalid conversion response: missing conversionResult';
      const failure = createFailureResult({
        conversionId: 'ui-invalid-success',
        converter: 'ui-wrapper',
        pipeline: [],
        inputFormat: 'markdown',
        outputFormat: 'asciidoc',
        inputFile: { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: startedAtIso,
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: [],
        logs: [],
        error: { code: 'INTERNAL_ERROR', message: msg, details: { stage: 'success-parse' }, recoverable: false },
        meta: { uiWrapper: 'markdown-to-asciidoc', stage: 'success-parse' },
      });
      const uiMsg = `Erreur lors de l'appel à l'API : ${msg}`;
      setStatus(uiMsg);
      setNotification({ message: uiMsg, type: 'error', visible: true });
      if (setBackendConversionResult) setBackendConversionResult(failure);
      if (setConversionUiState) setConversionUiState('error');
      return failure;
    }
    if ((backendConversionResult as any).success !== true) {
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const msg = 'Invalid conversion response: conversionResult.success is not true';
      const failure = createFailureResult({
        conversionId: (backendConversionResult as any).conversionId ?? 'ui-invalid-success',
        converter: (backendConversionResult as any).converter ?? 'ui-wrapper',
        pipeline: (backendConversionResult as any).pipeline ?? [],
        inputFormat: (backendConversionResult as any).inputFormat ?? 'markdown',
        outputFormat: (backendConversionResult as any).outputFormat ?? 'asciidoc',
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
        meta: (backendConversionResult as any).meta ?? { uiWrapper: 'markdown-to-asciidoc', stage: 'success-parse' },
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

    if (typeof data.asciidoc !== 'string') {
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const msg = 'Invalid conversion response: missing asciidoc output';
      const failure = createFailureResult({
        conversionId: (backendConversionResult as any).conversionId,
        converter: (backendConversionResult as any).converter ?? 'ui-wrapper',
        pipeline: (backendConversionResult as any).pipeline ?? [],
        inputFormat: (backendConversionResult as any).inputFormat ?? 'markdown',
        outputFormat: (backendConversionResult as any).outputFormat ?? 'asciidoc',
        inputFile: (backendConversionResult as any).inputFile ?? { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: (backendConversionResult as any).startedAt ?? startedAtIso,
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: (backendConversionResult as any).warnings ?? [],
        logs: (backendConversionResult as any).logs ?? [],
        error: { code: 'INTERNAL_ERROR', message: msg, details: { stage: 'success-parse' }, recoverable: false },
        meta: (backendConversionResult as any).meta ?? { uiWrapper: 'markdown-to-asciidoc', stage: 'success-parse' },
      });
      const uiMsg = `Erreur lors de l'appel à l'API : ${msg}`;
      setStatus(uiMsg);
      setNotification({ message: uiMsg, type: 'error', visible: true });
      if (setBackendConversionResult) setBackendConversionResult(failure);
      if (setConversionUiState) setConversionUiState('error');
      return failure;
    }

    if (setBackendConversionResult) setBackendConversionResult(conversionResult);
    setOutput(data.asciidoc);
    const warningCount = Array.isArray(conversionResult.warnings)
      ? conversionResult.warnings.length
      : 0;
    const successMessage =
      warningCount > 0
        ? `Conversion réussie ✔ (${warningCount} avertissement${warningCount > 1 ? 's' : ''})`
        : 'Conversion réussie ✔';
    setStatus(successMessage);
    setNotification({
      message: successMessage,
      type: 'success',
      visible: true,
    });
    if (setConversionUiState) setConversionUiState('success');
    return conversionResult;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      const timeoutMessage =
        "Erreur : Timeout - La conversion prend trop de temps. Le fichier est peut-être trop volumineux.";
      setStatus(timeoutMessage);
      setNotification({
        message: timeoutMessage,
        type: 'error',
        visible: true,
      });
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const fr = createFailureResult({
        conversionId: 'ui-timeout',
        converter: 'ui-wrapper',
        pipeline: [],
        inputFormat: 'markdown',
        outputFormat: 'asciidoc',
        inputFile: { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: new Date(attemptStartedAtMs).toISOString(),
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: [],
        logs: [],
        error: { code: 'INTERNAL_ERROR', message: timeoutMessage, details: { kind: 'AbortError' }, recoverable: true },
        meta: { uiWrapper: 'markdown-to-asciidoc', stage: 'timeout' },
      });
      if (setBackendConversionResult) setBackendConversionResult(fr);
      if (setConversionUiState) setConversionUiState('error');
      return fr;
    }
    if (e.message?.includes('NetworkError') || e.message?.includes('Failed to fetch')) {
      const networkMessage = `Erreur réseau : Impossible de contacter l'API à ${API_BASE}. Vérifiez que le serveur backend est démarré.`;
      setStatus(networkMessage);
      setNotification({
        message: networkMessage,
        type: 'error',
        visible: true,
      });
      const finishedAtMs = Date.now();
      const nowIso = new Date(finishedAtMs).toISOString();
      const fr = createFailureResult({
        conversionId: 'ui-network',
        converter: 'ui-wrapper',
        pipeline: [],
        inputFormat: 'markdown',
        outputFormat: 'asciidoc',
        inputFile: { kind: 'in-memory', bytes: text.length },
        outputFile: null,
        startedAt: new Date(attemptStartedAtMs).toISOString(),
        finishedAt: nowIso,
        durationMs: finishedAtMs - attemptStartedAtMs,
        warnings: [],
        logs: [],
        error: { code: 'INTERNAL_ERROR', message: networkMessage, details: { kind: 'NetworkError' }, recoverable: true },
        meta: { uiWrapper: 'markdown-to-asciidoc', stage: 'network' },
      });
      if (setBackendConversionResult) setBackendConversionResult(fr);
      if (setConversionUiState) setConversionUiState('error');
      return fr;
    }
    const errorMessage = `Erreur lors de l'appel à l'API : ${e.message ?? e}`;
    setStatus(errorMessage);
    setNotification({
      message: errorMessage,
      type: 'error',
      visible: true,
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
      inputFormat: 'markdown',
      outputFormat: 'asciidoc',
      inputFile: { kind: 'in-memory', bytes: text.length },
      outputFile: null,
      startedAt: new Date(attemptStartedAtMs).toISOString(),
      finishedAt: nowIso,
      durationMs: finishedAtMs - attemptStartedAtMs,
      warnings: [],
      logs: [],
      error: {
        code: 'INTERNAL_ERROR',
        message: errorMessage,
        details: { original: e?.message ?? String(e) },
        recoverable: false,
      },
      meta: { uiWrapper: 'markdown-to-asciidoc', stage: 'catch' },
    });
    if (setBackendConversionResult) setBackendConversionResult(fr);
    if (setConversionUiState) setConversionUiState('error');
    return fr;
  } finally {
    setLoading(false);
  }
}
