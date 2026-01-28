import { API_BASE } from './api';

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
  setErrorMessage?: (message: string) => void
) {
  if (!text.trim()) {
    setStatus("Veuillez entrer du texte à convertir");
    return;
  }

  setStatus("Conversion en cours...");
  setLoading(true);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout

    const res = await fetch(`${API_BASE}/to-markdown`, {
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
    setOutput(data.markdown ?? "");
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
