import { API_BASE, buildConversionFetchHeaders } from './api';
import { formatConversionErrorForUi, getErrorMessageForCode } from './error-code-messages';

/**
 * ============================================================================
 * CONFIRMATION TOKEN MANAGEMENT (SECURITY)
 * ============================================================================
 * 
 * Confirmation tokens are used to secure sensitive conversions. The backend
 * generates a unique, single-use, time-limited token. The frontend must request
 * this token BEFORE displaying the confirmation modal, then send it with the
 * conversion request.
 * 
 * FLOW:
 * 1. Frontend requests token → POST /api/confirmation/request
 * 2. Backend generates and returns token
 * 3. Frontend displays confirmation modal
 * 4. If user confirms, token is sent with conversion
 * 5. Backend validates and consumes token (single use)
 * 
 * ============================================================================
 */

/**
 * Requests a confirmation token from the backend
 * 
 * This function must be called BEFORE displaying the confirmation modal.
 * The returned token must be included in the conversion request for the
 * backend to accept the conversion.
 * 
 * @param fromFormat - Source format of the conversion
 * @param toFormat - Destination format of the conversion
 * @param contentSize - Content size in bytes (optional, for logging)
 * @returns Promise<string> Unique confirmation token
 * 
 * @throws Error if request fails or response is invalid
 * 
 * ENDPOINT: POST /api/confirmation/request
 */
export async function requestConfirmationToken(
  fromFormat: string,
  toFormat: string,
  contentSize?: number
): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/confirmation/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromFormat,
        toFormat,
        contentSize
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to request confirmation token: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.token) {
      throw new Error('Invalid response from confirmation token endpoint');
    }

    return data.token;
  } catch (error: any) {
    throw new Error(`Erreur lors de la demande de confirmation: ${error.message || error}`);
  }
}

/**
 * ============================================================================
 * GENERIC MULTI-FORMAT CONVERSION FUNCTION
 * ============================================================================
 * 
 * This function handles all conversions between different document formats.
 * It automatically selects the correct endpoint and conversion engine based
 * on source and destination formats.
 * 
 * ENDPOINTS USED BY FORMAT:
 * -------------------------
 * - AsciiDoc → Markdown: /to-markdown (downdoc)
 * - Markdown → AsciiDoc: /to-asciidoc (Pandoc)
 * - Plain text → Markdown: /text-to-markdown (text2markdown)
 * - HTML → other formats: /from-html (Pandoc)
 * - Other conversions: /convert (Pandoc, requires confirmation token)
 * 
 * SECURITY:
 * ---------
 * - The /convert endpoint REQUIRES a confirmation token
 * - Other endpoints are less sensitive but may require a token depending
 *   on backend configuration
 * 
 * CONVERSION OPTIONS:
 * -------------------
 * - conversionOptions: Object containing normalization, encoding,
 *   format-specific options, etc. (see ConversionOptions type)
 * 
 * ERROR HANDLING:
 * --------------
 * - Validation: Checks that text is not empty
 * - Validation: Checks that source and destination formats are different
 * - Timeout: 30 seconds maximum per conversion
 * - Network: Connection error detection
 * - HTTP: Error code and message display
 * 
 * ============================================================================
 */

/**
 * Converts text from a source format to a destination format
 * 
 * @param text - Content to convert
 * @param sourceFormat - Source format (asciidoc, markdown, html, pdf, yaml, json, txt)
 * @param targetFormat - Destination format (asciidoc, markdown, html, pdf, yaml, json, txt)
 * @param setStatus - Function to update status message
 * @param setOutput - Function to set converted result
 * @param setLoading - Function to manage loading state
 * @param setNotification - Function to display notifications
 * @param conversionOptions - Conversion options (normalization, encoding, etc.)
 * @param confirmationToken - Confirmation token (REQUIRED for /convert)
 * 
 * @throws Error if text is empty, if formats are identical,
 *         if token is missing for /convert, or on network/HTTP error
 */
export async function convertText(
  text: string,
  sourceFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  targetFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void,
  conversionOptions?: any,
  confirmationToken?: string | null,
  setShowErrorModal?: (show: boolean) => void,
  setErrorMessage?: (message: string) => void,
  setBackendConversionResult?: (result: any | null) => void,
  setConversionUiState?: (state: 'idle' | 'loading' | 'success' | 'error') => void,
  /** Client timeout; should match or slightly exceed backend CONVERSION_TIMEOUT_MS. */
  timeoutMs?: number,
  /** Abort previous attempt when the user starts a new conversion. */
  externalSignal?: AbortSignal | null,
  uiLabels?: {
    emptyInput?: string;
    sameFormat?: string;
    running?: string;
    error?: string;
    success?: string;
    successWarnings?: (count: number) => string;
    timeout?: string;
  },
) {
  const labels = {
    emptyInput: uiLabels?.emptyInput ?? 'Veuillez entrer du texte à convertir',
    sameFormat: uiLabels?.sameFormat ?? 'Les formats source et destination sont identiques',
    running: uiLabels?.running ?? 'Conversion en cours...',
    error: uiLabels?.error ?? 'Erreur de conversion',
    success: uiLabels?.success ?? 'Conversion réussie ✔',
    successWarnings:
      uiLabels?.successWarnings ??
      ((count: number) =>
        `Conversion réussie ✔ (${count} avertissement${count > 1 ? 's' : ''})`),
    timeout:
      uiLabels?.timeout ??
      'Erreur : Timeout - La conversion prend trop de temps. Le fichier est peut-être trop volumineux.',
  };

  const isMigratedAdocToMarkdown = sourceFormat === 'asciidoc' && targetFormat === 'markdown'
  const isMigratedMarkdownToAsciidoc = sourceFormat === 'markdown' && targetFormat === 'asciidoc'
  const isMigratedMarkdownToHtmlOrTxt =
    sourceFormat === 'markdown' && (targetFormat === 'html' || targetFormat === 'txt')
  const isMigratedTextToMarkdown = sourceFormat === 'txt' && targetFormat === 'markdown'
  const isMigratedTextToHtml = sourceFormat === 'txt' && targetFormat === 'html'
  // Step 8 flow: HTML -> * must preserve standardized backend semantics too.
  const isMigratedHtmlToAny = sourceFormat === 'html'
  const isMigratedContractPath =
    isMigratedAdocToMarkdown ||
    isMigratedMarkdownToAsciidoc ||
    isMigratedMarkdownToHtmlOrTxt ||
    isMigratedTextToMarkdown ||
    isMigratedTextToHtml ||
    isMigratedHtmlToAny

  if (!text.trim()) {
    setNotification(null);
    setStatus(labels.emptyInput);
    if (setConversionUiState) setConversionUiState('idle');
    return;
  }

  if (sourceFormat === targetFormat) {
    setNotification(null);
    setStatus(labels.sameFormat);
    if (setConversionUiState) setConversionUiState('idle');
    return;
  }

  setStatus(labels.running);
  setLoading(true);
  if (setConversionUiState) setConversionUiState('loading');
  // New attempt starts: clear transient stale indicators.
  setNotification(null);
  if (setShowErrorModal) setShowErrorModal(false);
  if (setErrorMessage) setErrorMessage("");
  if (setBackendConversionResult) setBackendConversionResult(null);
  // Prevent stale output from being presented as current attempt output on contract-first flows.
  if (isMigratedContractPath) {
    setOutput("");
  }

  try {
    const controller = new AbortController();
    const effectiveTimeoutMs =
      typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : 30_000;
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeoutMs);
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    let endpoint = '';
    let body: any = { text };

    // Determine endpoint according to formats
    if (sourceFormat === 'asciidoc' && targetFormat === 'markdown') {
      // AsciiDoc → Markdown: use downdoc
      endpoint = `${API_BASE}/api/to-markdown`;
      // Include options if Parsedown is enabled
      if (conversionOptions?.formatSpecific?.markdown?.parsedown) {
        body = { text, options: conversionOptions };
      }
    } else if (sourceFormat === 'markdown' && targetFormat === 'asciidoc') {
      // Markdown → AsciiDoc: use Pandoc
      endpoint = `${API_BASE}/api/to-asciidoc`;
    } else if (sourceFormat === 'markdown' && (targetFormat === 'html' || targetFormat === 'txt')) {
      // Markdown → HTML / TXT: dedicated in-memory Pandoc route (no confirmation token)
      endpoint = `${API_BASE}/api/from-markdown`;
      body = { text, to: targetFormat };
    } else if (sourceFormat === 'txt' && targetFormat === 'markdown') {
      // Plain text → Markdown: use text2markdown
      endpoint = `${API_BASE}/api/text-to-markdown`;
    } else if (sourceFormat === 'txt' && targetFormat === 'html') {
      // Plain text → HTML: dedicated local route (no confirmation token)
      endpoint = `${API_BASE}/api/from-text`;
      body = { text, to: 'html' };
    } else if (sourceFormat === 'html') {
      // HTML → other formats: use from-html endpoint
      endpoint = `${API_BASE}/api/from-html`;
      body = { text, to: targetFormat };
    } else {
      // For all other conversions (TXT to others, PDF, YAML, JSON, etc.): use secured /api/convert endpoint
      endpoint = `${API_BASE}/api/convert`;
      body = {
        content: text,
        fromFormat: sourceFormat,
        toFormat: targetFormat,
        options: conversionOptions,
        token: confirmationToken || null // Confirmation token REQUIRED
      };
      
      // Verify that token is present for /convert endpoint
      if (!confirmationToken) {
        throw new Error('Confirmation token is required for conversion');
      }
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: buildConversionFetchHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorText = "";
      let errorDetail = "";
      let errorJson: any = null;
      
      try {
        // Try to parse as JSON first (backend returns JSON with 'detail' field and may include conversionResult)
        errorJson = await res.json().catch(() => null);
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

      const structuredFailure =
        errorJson && typeof errorJson === 'object' && errorJson.success === false && errorJson.error && typeof errorJson.error === 'object'
          ? errorJson
          : null;

      if (structuredFailure) {
        if (setBackendConversionResult) setBackendConversionResult(structuredFailure);
        const backendError = structuredFailure.error || {};
        const backendMessage =
          typeof backendError.message === 'string' && backendError.message.trim().length > 0
            ? backendError.message
            : (errorDetail || errorText || `HTTP Error ${res.status}`);
        const backendCode = typeof backendError.code === 'string' ? backendError.code : '';

        // Prevent stale success output from being presented as current failed conversion output.
        if (isMigratedContractPath) {
          setOutput("");
        }

        const shouldShowConversionErrorModal = Boolean(backendCode);

        if (shouldShowConversionErrorModal && setShowErrorModal && setErrorMessage) {
          setShowErrorModal(true);
          setErrorMessage(backendMessage);
        }

        setStatus("Erreur de conversion");
        const uiErrorMessage = formatConversionErrorForUi(
          backendCode,
          `Erreur de conversion${backendCode ? ` (${backendCode})` : ''}`,
          typeof backendError.hint === 'string' ? backendError.hint : null
        );
        setNotification({
          message: uiErrorMessage,
          type: 'error',
          visible: true
        });
        if (setConversionUiState) setConversionUiState('error');
        return;
      }
      
      const errorMessage = `HTTP Error ${res.status}${errorText ? `: ${errorText}` : ""}`;
      
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
        // Show error modal instead of throwing
        const modalMessage = 'La conversion a échoué. Le résultat contient encore de l\'AsciiDoc au lieu du Markdown. Veuillez modifier la source et réessayer la conversion.';
        if (setShowErrorModal && setErrorMessage) {
          setShowErrorModal(true);
          setErrorMessage(modalMessage);
        }
        setStatus("Erreur de conversion");
        setNotification({
          message: "Erreur de conversion - Veuillez modifier la source",
          type: 'error',
          visible: true
        });
        if (setConversionUiState) setConversionUiState('error');
        return;
      }
      
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const conversionResult = data && typeof data === 'object' ? (data as any).conversionResult : null;
    if (isMigratedContractPath && (!conversionResult || typeof conversionResult !== 'object')) {
      throw new Error('Invalid conversion response: missing conversionResult')
    }
    if (conversionResult && typeof conversionResult === 'object') {
      if (typeof conversionResult.success !== 'boolean') {
        throw new Error('Invalid conversionResult: missing boolean success');
      }
      if (conversionResult.success !== true) {
        // Treat as a structured failure (do not flatten to generic throw).
        if (setBackendConversionResult) setBackendConversionResult(conversionResult);
        const backendError = (conversionResult as any).error || {};
        const backendMessage =
          typeof backendError.message === 'string' && backendError.message.trim().length > 0
            ? backendError.message
            : 'ConversionResult indicates failure'
        const backendCode = typeof backendError.code === 'string' ? backendError.code : '';

        // Prevent stale success output from being presented as current failed conversion output.
        if (isMigratedContractPath) {
          setOutput("");
        }

        const shouldShowConversionErrorModal = Boolean(backendCode);

        if (shouldShowConversionErrorModal && setShowErrorModal && setErrorMessage) {
          setShowErrorModal(true);
          setErrorMessage(backendMessage);
        }

        setStatus("Erreur de conversion");
        const uiErrorMessage = formatConversionErrorForUi(
          backendCode,
          `Erreur de conversion${backendCode ? ` (${backendCode})` : ''}`,
          typeof backendError.hint === 'string' ? backendError.hint : null
        );
        setNotification({
          message: uiErrorMessage,
          type: 'error',
          visible: true
        });
        if (setConversionUiState) setConversionUiState('error');
        return;
      }
      if (setBackendConversionResult) setBackendConversionResult(conversionResult);
    }
    // For migrated paths, require the expected output field so success display
    // stays owned by the current structured conversion result.
    let result = ""
    if (isMigratedAdocToMarkdown) {
      if (typeof data.markdown !== 'string') {
        throw new Error('Invalid conversion response: missing markdown output')
      }
      result = data.markdown
    } else if (isMigratedTextToMarkdown) {
      if (typeof data.markdown !== 'string') {
        throw new Error('Invalid conversion response: missing markdown output')
      }
      result = data.markdown
    } else if (isMigratedMarkdownToAsciidoc) {
      if (typeof data.asciidoc !== 'string') {
        throw new Error('Invalid conversion response: missing asciidoc output')
      }
      result = data.asciidoc
    } else if (isMigratedMarkdownToHtmlOrTxt || isMigratedTextToHtml || isMigratedHtmlToAny) {
      const out = (data as any)[targetFormat]
      if (typeof out !== 'string') {
        throw new Error(`Invalid conversion response: missing ${targetFormat} output`)
      }
      result = out
    } else {
      // Handle legacy/non-migrated responses according to endpoint
      result = data.markdown || data.asciidoc || data.result || "";
    }
    if (!result.trim()) {
      if (isMigratedContractPath) {
        setOutput('');
      }
      const emptyMessage = 'Erreur de conversion (EMPTY_OUTPUT)';
      const uiErrorMessage = formatConversionErrorForUi(
        'EMPTY_OUTPUT',
        emptyMessage
      );
      setStatus(labels.error);
      setNotification({
        message: uiErrorMessage,
        type: 'error',
        visible: true,
      });
      if (setShowErrorModal && setErrorMessage) {
        setShowErrorModal(true);
        setErrorMessage(getErrorMessageForCode('EMPTY_OUTPUT', emptyMessage));
      }
      if (setConversionUiState) setConversionUiState('error');
      return;
    }
    setOutput(result);
    const warningCount = Array.isArray(conversionResult?.warnings)
      ? conversionResult.warnings.length
      : 0;
    const successMessage =
      warningCount > 0 ? labels.successWarnings(warningCount) : labels.success;
    setStatus(successMessage);
    setNotification({
      message: successMessage,
      type: 'success',
      visible: true
    });
    if (setConversionUiState) setConversionUiState('success');
  } catch (e: any) {
    // Keep current-attempt ownership coherent on migrated paths: any request-time
    // error should not leave previous successful output presented as current.
    if (isMigratedContractPath) {
      setOutput("");
    }
    if (e.name === "AbortError") {
      // Superseded by a newer attempt — do not surface a timeout error.
      if (externalSignal?.aborted) {
        return;
      }
      const timeoutMessage = labels.timeout;
      setStatus(timeoutMessage);
      setNotification({
        message: timeoutMessage,
        type: 'error',
        visible: true
      });
      if (setConversionUiState) setConversionUiState('error');
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      const networkMessage = `Erreur réseau : Impossible de contacter l'API à ${API_BASE}. Vérifiez que le serveur backend est démarré.`;
      setStatus(networkMessage);
      setNotification({
        message: networkMessage,
        type: 'error',
        visible: true
      });
      if (setConversionUiState) setConversionUiState('error');
    } else {
      const errorMessage = `Erreur lors de l'appel à l'API : ${e.message ?? e}`;
      setStatus(errorMessage);
      setNotification({
        message: errorMessage,
        type: 'error',
        visible: true
      });
      if (setConversionUiState) setConversionUiState('error');
    }
  } finally {
    setLoading(false);
  }
}
