import { API_BASE } from './api';

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
 * - HTTP error: Display error code and message
 */
export async function convertMarkdownToAsciiDoc(
  text: string,
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void,
  setConversionMode?: (mode: 'adoc-to-md' | 'md-to-adoc') => void
) {
  if (!text.trim()) {
    setStatus("Veuillez entrer du texte à convertir");
    return;
  }

  setStatus("Conversion en cours...");
  setLoading(true);
  if (setConversionMode) {
    setConversionMode('md-to-adoc');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${API_BASE}/to-asciidoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Erreur HTTP ${res.status}${errorText ? `: ${errorText}` : ""}`);
    }

    const data = await res.json();
    setOutput(data.asciidoc ?? "");
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
