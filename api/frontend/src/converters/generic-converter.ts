import { API_BASE } from './api';

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
  setErrorMessage?: (message: string) => void
) {
  if (!text.trim()) {
    setStatus("Veuillez entrer du texte à convertir");
    return;
  }

  if (sourceFormat === targetFormat) {
    setStatus("Les formats source et destination sont identiques");
    return;
  }

  setStatus("Conversion en cours...");
  setLoading(true);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let endpoint = '';
    let body: any = { text };

    // Determine endpoint according to formats
    if (sourceFormat === 'asciidoc' && targetFormat === 'markdown') {
      // AsciiDoc → Markdown: use downdoc
      endpoint = `${API_BASE}/to-markdown`;
      // Include options if Parsedown is enabled
      if (conversionOptions?.formatSpecific?.markdown?.parsedown) {
        body = { text, options: conversionOptions };
      }
    } else if (sourceFormat === 'markdown' && targetFormat === 'asciidoc') {
      // Markdown → AsciiDoc: use Pandoc
      endpoint = `${API_BASE}/to-asciidoc`;
    } else if (sourceFormat === 'txt' && targetFormat === 'markdown') {
      // Plain text → Markdown: use text2markdown
      endpoint = `${API_BASE}/text-to-markdown`;
    } else if (sourceFormat === 'html') {
      // HTML → other formats: use from-html endpoint
      endpoint = `${API_BASE}/from-html`;
      body = { text, to: targetFormat };
    } else {
      // For all other conversions (TXT to others, PDF, YAML, JSON, etc.): use generic /convert endpoint
      endpoint = `${API_BASE}/convert`;
      body = { 
        text, 
        from: sourceFormat, 
        to: targetFormat, 
        options: conversionOptions,
        confirmationToken: confirmationToken || null // Confirmation token REQUIRED
      };
      
      // Verify that token is present for /convert endpoint
      if (!confirmationToken) {
        throw new Error('Confirmation token is required for conversion');
      }
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorText = "";
      let errorDetail = "";
      
      try {
        // Try to parse as JSON first (backend returns JSON with 'detail' field)
        const errorJson = await res.json().catch(() => null);
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
        return;
      }
      
      throw new Error(errorMessage);
    }

    const data = await res.json();
    // Handle different responses according to endpoint
    const result = data.markdown || data.asciidoc || data.result || "";
    setOutput(result);
    setStatus("Conversion réussie ✔");
    setNotification({
      message: "Conversion réussie ✔",
      type: 'success',
      visible: true
    });
  } catch (e: any) {
    if (e.name === "AbortError") {
      const timeoutMessage = "Erreur : Timeout - La conversion prend trop de temps. Le fichier est peut-être trop volumineux.";
      setStatus(timeoutMessage);
      setNotification({
        message: timeoutMessage,
        type: 'error',
        visible: true
      });
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      const networkMessage = `Erreur réseau : Impossible de contacter l'API à ${API_BASE}. Vérifiez que le serveur backend est démarré.`;
      setStatus(networkMessage);
      setNotification({
        message: networkMessage,
        type: 'error',
        visible: true
      });
    } else {
      const errorMessage = `Erreur lors de l'appel à l'API : ${e.message ?? e}`;
      setStatus(errorMessage);
      setNotification({
        message: errorMessage,
        type: 'error',
        visible: true
      });
    }
  } finally {
    setLoading(false);
  }
}
