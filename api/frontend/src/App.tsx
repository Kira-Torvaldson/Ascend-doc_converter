import { useMemo, useRef, useState, useCallback } from "react";

const API_BASE = "http://localhost:3003";

async function convertAsciiDocToMarkdown(
  text: string,
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void
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
      const errorText = await res.text().catch(() => "");
      throw new Error(`Erreur HTTP ${res.status}${errorText ? `: ${errorText}` : ""}`);
    }

    const data = await res.json();
    setOutput(data.markdown ?? "");
    setStatus("Conversion réussie ✔");
  } catch (e: any) {
    if (e.name === "AbortError") {
      setStatus("Erreur : Timeout - La conversion prend trop de temps. Le fichier est peut-être trop volumineux.");
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      setStatus(`Erreur réseau : Impossible de contacter l'API à ${API_BASE}. Vérifiez que le serveur backend est démarré.`);
    } else {
      setStatus(`Erreur lors de l'appel à l'API : ${e.message ?? e}`);
    }
  } finally {
    setLoading(false);
  }
}

async function convertMarkdownToAsciiDoc(
  text: string,
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
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
  } catch (e: any) {
    if (e.name === "AbortError") {
      setStatus("Erreur : Timeout - La conversion prend trop de temps. Le fichier est peut-être trop volumineux.");
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      setStatus(`Erreur réseau : Impossible de contacter l'API à ${API_BASE}. Vérifiez que le serveur backend est démarré.`);
    } else {
      setStatus(`Erreur lors de l'appel à l'API : ${e.message ?? e}`);
    }
  } finally {
    setLoading(false);
  }
}

// Fonction de conversion générique selon les formats source et destination
async function convertText(
  text: string,
  sourceFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  targetFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void
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

    // Déterminer l'endpoint selon les formats
    if (sourceFormat === 'asciidoc' && targetFormat === 'markdown') {
      // AsciiDoc → Markdown : utiliser downdoc
      endpoint = `${API_BASE}/to-markdown`;
    } else if (sourceFormat === 'markdown' && targetFormat === 'asciidoc') {
      // Markdown → AsciiDoc : utiliser Pandoc
      endpoint = `${API_BASE}/to-asciidoc`;
    } else if (sourceFormat === 'txt' && targetFormat === 'markdown') {
      // Texte brut → Markdown : utiliser text2markdown
      endpoint = `${API_BASE}/text-to-markdown`;
    } else if (sourceFormat === 'html') {
      // HTML → autres formats : utiliser l'endpoint from-html
      endpoint = `${API_BASE}/from-html`;
      body = { text, to: targetFormat };
    } else {
      // Pour toutes les autres conversions (TXT vers autres, PDF, YAML, JSON, etc.) : utiliser l'endpoint générique /convert
      endpoint = `${API_BASE}/convert`;
      body = { text, from: sourceFormat, to: targetFormat };
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
      const errorText = await res.text().catch(() => "");
      throw new Error(`Erreur HTTP ${res.status}${errorText ? `: ${errorText}` : ""}`);
    }

    const data = await res.json();
    // Gérer les différentes réponses selon l'endpoint
    const result = data.markdown || data.asciidoc || data.result || "";
    setOutput(result);
    setStatus("Conversion réussie ✔");
  } catch (e: any) {
    if (e.name === "AbortError") {
      setStatus("Erreur : Timeout - La conversion prend trop de temps. Le fichier est peut-être trop volumineux.");
    } else if (e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      setStatus(`Erreur réseau : Impossible de contacter l'API à ${API_BASE}. Vérifiez que le serveur backend est démarré.`);
    } else {
      setStatus(`Erreur lors de l'appel à l'API : ${e.message ?? e}`);
    }
  } finally {
    setLoading(false);
  }
}

function App() {
  const [adocInput, setAdocInput] = useState<string>("");
  const [mdOutput, setMdOutput] = useState<string>("");

  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const [folderFiles, setFolderFiles] = useState<File[]>([]); // Fichiers du dossier sélectionné
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1); // Index du fichier sélectionné
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingResult, setIsEditingResult] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showClearResultModal, setShowClearResultModal] = useState<boolean>(false);
  const [showClearSourceModal, setShowClearSourceModal] = useState<boolean>(false);
  const [originalAdocInput, setOriginalAdocInput] = useState<string>("");
  const [originalMdOutput, setOriginalMdOutput] = useState<string>("");

  const [swapped, setSwapped] = useState<boolean>(false);
  const [conversionMode, setConversionMode] = useState<'adoc-to-md' | 'md-to-adoc'>('adoc-to-md');
  // Mode visuel pour déterminer quels panneaux afficher (change avec les flèches)
  const [visualMode, setVisualMode] = useState<'adoc-to-md' | 'md-to-adoc'>('adoc-to-md');
  
  // Formats de conversion
  type FormatType = 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt';
  const [sourceFormat, setSourceFormat] = useState<FormatType>('asciidoc');
  const [targetFormat, setTargetFormat] = useState<FormatType>('markdown');

  const adocTextAreaRef = useRef<HTMLTextAreaElement | null>(null);


  // Extraction des titres AsciiDoc (=, ==, etc.) et Markdown (#, ##, etc.) pour naviguer dans le fichier
  const headings = useMemo(() => {
    // Utiliser le texte selon le format source
    const text = sourceFormat === 'asciidoc' ? adocInput : (sourceFormat === 'markdown' ? mdOutput : adocInput);
    if (!text) return [];
    
    const lines = text.split("\n");
    return lines
      .map((line, index) => {
        // Détecter les titres AsciiDoc (= Title)
        const adocMatch = line.match(/^(=+)\s+(.*)$/);
        if (adocMatch) {
          const level = adocMatch[1].length;
          const title = adocMatch[2].trim();
          return { lineIndex: index, level, title };
        }
        
        // Détecter les titres Markdown (# Title)
        const mdMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (mdMatch) {
          const level = mdMatch[1].length;
          const title = mdMatch[2].trim();
          return { lineIndex: index, level, title };
        }
        
        return null;
      })
      .filter(Boolean) as { lineIndex: number; level: number; title: string }[];
  }, [adocInput, mdOutput, sourceFormat]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      // Utiliser sourceFormat pour déterminer où mettre le texte
      if (sourceFormat === 'asciidoc' || sourceFormat === 'html' || sourceFormat === 'pdf' || sourceFormat === 'yaml' || sourceFormat === 'json' || sourceFormat === 'txt') {
        setAdocInput(text);
      } else if (sourceFormat === 'markdown') {
        setMdOutput(text);
      }
      setCurrentFileName(file.name);
      setImportedFiles([file]);
      setStatus(`Fichier chargé : ${file.name}`);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleFolderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const textFiles = fileArray.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['.adoc', '.asciidoc', '.md', '.txt'].some(validExt => 
        file.name.toLowerCase().endsWith(validExt)
      );
    });

    if (textFiles.length === 0) {
      setStatus("Aucun fichier texte trouvé dans le dossier");
      return;
    }

    // Stocker les fichiers du dossier et réinitialiser la sélection
    setFolderFiles(textFiles);
    setSelectedFileIndex(-1);
    setImportedFiles([]);
    setCurrentFileName(null);
    setStatus(`✅ Dossier chargé : ${textFiles.length} fichier${textFiles.length > 1 ? 's' : ''} trouvé${textFiles.length > 1 ? 's' : ''}`);
  };

  const handleFileSelect = async (fileIndex: number) => {
    if (fileIndex < 0 || fileIndex >= folderFiles.length) return;

    const selectedFile = folderFiles[fileIndex];
    setSelectedFileIndex(fileIndex);
    setImportedFiles([selectedFile]);
    setCurrentFileName(selectedFile.name);

    // Lire le fichier sélectionné
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        // Utiliser sourceFormat pour déterminer où mettre le texte
        if (sourceFormat === 'asciidoc' || sourceFormat === 'html' || sourceFormat === 'pdf' || sourceFormat === 'yaml' || sourceFormat === 'json') {
          setAdocInput(text);
        } else if (sourceFormat === 'markdown') {
          setMdOutput(text);
        }
        setStatus(`Fichier chargé : ${selectedFile.name}`);
      };
      reader.onerror = () => {
        setStatus(`Erreur lors de la lecture du fichier : ${selectedFile.name}`);
      };
      reader.readAsText(selectedFile, "utf-8");
    } catch (e: any) {
      setStatus(`Erreur lors de la lecture du fichier : ${e.message ?? e}`);
    }
  };

  const scrollToHeading = (lineIndex: number) => {
    const textarea = adocTextAreaRef.current;
    if (!textarea) return;

    const lines = adocInput.split("\n");
    const offsetBefore = lines.slice(0, lineIndex).join("\n").length;

    textarea.focus();
    textarea.setSelectionRange(offsetBefore, offsetBefore);

    // Force le scroll sur la sélection
    const lineHeight = 18; // approximation
    textarea.scrollTop = Math.max(0, (lineIndex - 2) * lineHeight);
  };

  const handleCopy = async () => {
    // Copier le texte du résultat selon le format de destination
    const textToCopy = targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt' ? mdOutput : adocInput;
    if (!textToCopy || !textToCopy.trim()) {
      setStatus("Aucun texte à copier");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setStatus(`Texte copié (${textToCopy.length} caractères)`);
      setTimeout(() => {
        setCopied(false);
        if (status.includes("copié")) {
          setStatus("");
        }
      }, 2000);
    } catch (err) {
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setStatus(`Texte copié (${textToCopy.length} caractères)`);
        setTimeout(() => {
          setCopied(false);
          if (status.includes("copié")) {
            setStatus("");
          }
        }, 2000);
      } catch (err) {
        setStatus("Erreur lors de la copie");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleClear = () => {
    setShowClearResultModal(true);
  };

  const confirmClearResult = () => {
    // Effacer uniquement le résultat selon le format de destination
    if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt') {
      setMdOutput("");
    } else if (targetFormat === 'asciidoc') {
      setAdocInput("");
    }
    
    setStatus("Résultat effacé");
    setShowClearResultModal(false);
  };

  const handleClearAdoc = () => {
    setAdocInput("");
    setCurrentFileName(null);
    setImportedFiles([]);
    setFolderFiles([]);
    setSelectedFileIndex(-1);
    setStatus("Contenu AsciiDoc effacé");
  };

  // Fonction pour obtenir le titre du format
  const getFormatTitle = useCallback((format: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt') => {
    const titles = {
      'asciidoc': 'AsciiDoc',
      'markdown': 'Markdown',
      'html': 'HTML',
      'pdf': 'PDF',
      'yaml': 'YAML',
      'json': 'JSON',
      'txt': 'Texte'
    };
    return titles[format];
  }, []);

  // Fonction générique pour effacer le contenu selon le format source
  const handleClearSource = useCallback(() => {
    setShowClearSourceModal(true);
  }, []);

  const confirmClearSource = useCallback(() => {
    // Effacer uniquement la source
    const formatTitle = getFormatTitle(sourceFormat);
    if (sourceFormat === 'asciidoc' || sourceFormat === 'html' || sourceFormat === 'pdf' || sourceFormat === 'yaml' || sourceFormat === 'json' || sourceFormat === 'txt') {
      setAdocInput("");
      setStatus(`Contenu ${formatTitle} effacé`);
    } else if (sourceFormat === 'markdown') {
      setMdOutput("");
      setStatus(`Contenu ${formatTitle} effacé`);
    }
    setCurrentFileName(null);
    setImportedFiles([]);
    setFolderFiles([]);
    setSelectedFileIndex(-1);
    setShowClearSourceModal(false);
  }, [sourceFormat, getFormatTitle]);

  const confirmClearSourceAndResult = useCallback(() => {
    // Effacer la source et le résultat
    const formatTitle = getFormatTitle(sourceFormat);
    
    // Effacer la source
    if (sourceFormat === 'asciidoc' || sourceFormat === 'html' || sourceFormat === 'pdf' || sourceFormat === 'yaml' || sourceFormat === 'json' || sourceFormat === 'txt') {
      setAdocInput("");
    } else if (sourceFormat === 'markdown') {
      setMdOutput("");
    }
    
    // Effacer le résultat
    if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt') {
      setMdOutput("");
    } else if (targetFormat === 'asciidoc') {
      setAdocInput("");
    }
    
    // Réinitialiser les fichiers
    setCurrentFileName(null);
    setImportedFiles([]);
    setFolderFiles([]);
    setSelectedFileIndex(-1);
    
    setStatus(`Source ${formatTitle} et résultat effacés`);
    setShowClearSourceModal(false);
  }, [sourceFormat, targetFormat, getFormatTitle]);

  const handleSaveAdoc = () => {
    if (!adocInput || !adocInput.trim()) {
      setStatus("Aucun contenu à sauvegarder");
      return;
    }

    try {
      const blob = new Blob([adocInput], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Utiliser le nom du fichier actuel ou un nom par défaut
      const fileName = currentFileName 
        ? currentFileName.replace(/\.[^/.]+$/, '.adoc') 
        : 'document.adoc';
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus(`Fichier sauvegardé : ${fileName}`);
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Erreur lors de la sauvegarde");
    }
  };

  // Fonction de conversion générique utilisant les formats sélectionnés
  const handleConvert = useCallback(() => {
    // Déterminer le texte source selon le format source
    let sourceText = "";
    if (sourceFormat === 'asciidoc') {
      sourceText = adocTextAreaRef.current?.value || adocInput;
    } else if (sourceFormat === 'markdown') {
      sourceText = mdOutput;
    } else if (sourceFormat === 'html' || sourceFormat === 'pdf' || sourceFormat === 'yaml' || sourceFormat === 'json' || sourceFormat === 'txt') {
      // Pour HTML, PDF, YAML, JSON, TXT, utiliser adocInput comme zone de texte temporaire
      sourceText = adocInput;
    }

    if (!sourceText.trim()) {
      setStatus("Veuillez entrer du texte à convertir");
      return;
    }

    // Déterminer où mettre le résultat selon le format de destination
    const setOutput = (result: string) => {
      if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt') {
        setMdOutput(result);
      } else if (targetFormat === 'asciidoc') {
        setAdocInput(result);
      }
    };

    convertText(
      sourceText,
      sourceFormat,
      targetFormat,
      setStatus,
      setOutput,
      setLoading
    );
  }, [sourceFormat, targetFormat, adocInput, mdOutput]);

  // Composant réutilisable pour le panneau source
  const renderSourcePanel = (
    title: string,
    value: string,
    setValue: (value: string) => void,
    placeholder: string,
    textAreaRef: React.RefObject<HTMLTextAreaElement> | null,
    onConvert: () => void,
    showHeadings: boolean = false,
    canConvert: boolean = true,
    onClear?: () => void
  ) => (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label className="file-input-label">
            <span>📄</span>
            <input
              type="file"
              accept=".adoc,.asciidoc,.md,.txt"
              onChange={handleFileChange}
            />
          </label>
          <label className="file-input-label">
            <span>📁</span>
            <input
              type="file"
              {...({ webkitdirectory: "" } as any)}
              multiple
              onChange={handleFolderChange}
            />
          </label>
          {onClear && (
            <button
              onClick={onClear}
              disabled={!value.trim()}
              style={{
                fontSize: "0.85rem",
                padding: "0.4rem 0.9rem",
                background: "#ef4444"
              }}
              title={`Effacer le contenu ${title}`}
            >
              🗑️ 
            </button>
          )}
          <button
            onClick={onConvert}
            disabled={loading || !value.trim() || !canConvert}
            title={!canConvert ? "Les formats source et destination doivent être différents" : ""}
          >
            {loading ? "Conversion..." : "Convertir"}
          </button>
        </div>
      </div>
      <div className="panel-toolbar">
        {currentFileName && (
          <span className="file-name">{currentFileName}</span>
        )}
      </div>
      {folderFiles.length > 0 && (
        <div className="file-selector">
          <label className="file-selector-label">
            <span>📂</span>
            <span>Sélectionner un fichier à convertir</span>
          </label>
          <select
            className="file-selector-select"
            value={selectedFileIndex}
            onChange={(e) => handleFileSelect(parseInt(e.target.value))}
          >
            <option value={-1}>-- Choisir un fichier --</option>
            {folderFiles.map((file, index) => (
              <option key={index} value={index}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </option>
            ))}
          </select>
          {folderFiles.length > 0 && (
            <div className="file-selector-info">
              <span>📁</span>
              <span>{folderFiles.length} fichier{folderFiles.length > 1 ? 's' : ''} disponible{folderFiles.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
      <p className="status status-inline">{status}</p>
      {showHeadings && headings.length > 0 && (
        <div className="headings">
          <span className="headings-title">📑 Navigation dans le fichier</span>
          <ul>
            {headings.map((h: { lineIndex: number; level: number; title: string }, index: number) => {
              // Déterminer le type d'icône selon le niveau
              const getIcon = (level: number) => {
                switch (level) {
                  case 1: return '📖'; // Chapitre principal
                  case 2: return '📄'; // Section
                  case 3: return '📝'; // Sous-section
                  case 4: return '•'; // Sous-sous-section
                  default: return '◦'; // Niveaux plus profonds
                }
              };
              
              // Déterminer le label selon le niveau
              const getLevelLabel = (level: number) => {
                switch (level) {
                  case 1: return 'Chapitre';
                  case 2: return 'Section';
                  case 3: return 'Sous-section';
                  default: return '';
                }
              };

              return (
                <li
                  key={`${h.lineIndex}-${h.title}`}
                  className={`heading-level-${h.level}`}
                  style={{ marginLeft: (h.level - 1) * 16 }}
                  onClick={() => scrollToHeading(h.lineIndex)}
                  title={`${getLevelLabel(h.level)} - Ligne ${h.lineIndex + 1}`}
                >
                  <span className="heading-icon">{getIcon(h.level)}</span>
                  <span className="heading-text">{h.title}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <textarea
        ref={textAreaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </section>
  );

  // Fonction pour obtenir le placeholder selon le format
  const getFormatPlaceholder = useCallback((format: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt') => {
    const placeholders = {
      'asciidoc': 'Texte AsciiDoc...',
      'markdown': 'Texte Markdown...',
      'html': 'Contenu HTML...',
      'pdf': 'Contenu PDF...',
      'yaml': 'Contenu YAML...',
      'json': 'Contenu JSON...',
      'txt': 'Texte brut...'
    };
    return placeholders[format];
  }, []);

  // Panneau source : affiche le format source sélectionné
  const sourceCard = useMemo(() => {
    let sourceValue = "";
    let setSourceValue = (v: string) => {};
    let sourceRef: React.RefObject<HTMLTextAreaElement> | null = null;

    if (sourceFormat === 'asciidoc') {
      sourceValue = adocInput;
      setSourceValue = setAdocInput;
      sourceRef = adocTextAreaRef;
    } else if (sourceFormat === 'markdown') {
      sourceValue = mdOutput;
      setSourceValue = setMdOutput;
      sourceRef = null;
    } else if (sourceFormat === 'html' || sourceFormat === 'pdf' || sourceFormat === 'yaml' || sourceFormat === 'json' || sourceFormat === 'txt') {
      sourceValue = adocInput; // Utiliser adocInput temporairement pour HTML, PDF, YAML, JSON, TXT
      setSourceValue = setAdocInput;
      sourceRef = adocTextAreaRef;
    }

    return renderSourcePanel(
      getFormatTitle(sourceFormat),
      sourceValue,
      setSourceValue,
      getFormatPlaceholder(sourceFormat),
      sourceRef,
      handleConvert,
      sourceFormat === 'asciidoc', // Afficher les headings uniquement pour AsciiDoc
      sourceFormat !== targetFormat, // Peut convertir si formats différents
      handleClearSource // Fonction pour effacer le contenu source
    );
  }, [sourceFormat, adocInput, mdOutput, currentFileName, status, headings, loading, folderFiles, selectedFileIndex, handleConvert, getFormatTitle, getFormatPlaceholder, adocTextAreaRef]);

  // Panneau résultat : affiche le format de destination sélectionné
  const resultCard = useMemo(() => {
    let resultValue = "";
    let setResultValue = (v: string) => {};

    if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt') {
      resultValue = mdOutput;
      setResultValue = setMdOutput;
    } else if (targetFormat === 'asciidoc') {
      resultValue = adocInput;
      setResultValue = setAdocInput;
    }

    return (
    <section className="panel">
      <div className="panel-header">
        <h2>{getFormatTitle(targetFormat)}</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {resultValue && (
            <>
              <button
                onClick={() => {
                  if (isEditingResult) {
                    setShowCancelModal(true);
                  } else {
                    setShowEditModal(true);
                  }
                }}
                style={{ 
                  fontSize: "0.85rem", 
                  padding: "0.4rem 0.9rem",
                  background: isEditingResult ? "#ef4444" : "#6b7280"
                }}
                title={isEditingResult ? "Annuler l'édition" : "Activer l'édition"}
              >
                {isEditingResult ? "✕ Annuler" : "✏️"}
              </button>
              {isEditingResult && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  style={{ 
                    fontSize: "0.85rem", 
                    padding: "0.4rem 0.9rem",
                    background: "#10b981"
                  }}
                  title="Sauvegarder les modifications"
                >
                  💾 Sauvegarder
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={isEditingResult}
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
                title={isEditingResult ? "Copie désactivée en mode édition" : "Copier le résultat"}
              >
                {copied ? "✓ Copié" : "📋"}
              </button>
              <button
                onClick={handleClear}
                disabled={isEditingResult}
                style={{ 
                  fontSize: "0.85rem", 
                  padding: "0.4rem 0.9rem",
                  background: "#ef4444"
                }}
                title={isEditingResult ? "Effacement désactivé en mode édition" : "Effacer le résultat"}
              >
                🗑️ 
              </button>
            </>
          )}
        </div>
      </div>
      <textarea
        value={resultValue}
        onChange={(e) => setResultValue(e.target.value)}
        readOnly={!isEditingResult}
        placeholder={`Résultat ${getFormatTitle(targetFormat)}...`}
        style={{
          cursor: isEditingResult ? "text" : "default"
        }}
      />
    </section>
    );
  }, [targetFormat, adocInput, mdOutput, status, loading, copied, isEditingResult, getFormatTitle, setMdOutput, setAdocInput]);

  return (
    <div className="page">
      <header className="header">
        <div className="header-main">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img
              src="http://localhost:3003/public/logo.png"
              alt="Logo"
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                objectFit: "cover",
              }}
            />
            <div>
              <h1>Ascend - Convertisseur de documents</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>
                De :
              </label>
              <select
                value={sourceFormat}
                onChange={(e) => {
                  const newFormat = e.target.value as FormatType;
                  setSourceFormat(newFormat);
                  // Ajuster le format de destination si nécessaire
                  if (newFormat === targetFormat) {
                    const alternatives: FormatType[] = ['asciidoc', 'markdown', 'html', 'pdf', 'yaml', 'json', 'txt'];
                    const newTarget = alternatives.find(f => f !== newFormat) || 'markdown';
                    setTargetFormat(newTarget);
                  }
                }}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(209, 213, 219, 0.3)",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(2px)",
                  fontSize: "0.875rem",
                  color: "#111827",
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                <option value="asciidoc">AsciiDoc</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="pdf">PDF</option>
                <option value="yaml">YAML</option>
                <option value="json">JSON</option>
                <option value="txt">Texte</option>
              </select>
            </div>
            <span style={{ fontSize: "1.2rem", color: "#6b7280" }}>→</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>
                Vers :
              </label>
              <select
                value={targetFormat}
                onChange={(e) => {
                  const newFormat = e.target.value as FormatType;
                  setTargetFormat(newFormat);
                  // Ajuster le format source si nécessaire
                  if (newFormat === sourceFormat) {
                    const alternatives: FormatType[] = ['asciidoc', 'markdown', 'html', 'pdf', 'yaml', 'json', 'txt'];
                    const newSource = alternatives.find(f => f !== newFormat) || 'asciidoc';
                    setSourceFormat(newSource);
                  }
                }}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(209, 213, 219, 0.3)",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(2px)",
                  fontSize: "0.875rem",
                  color: "#111827",
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                <option value="markdown">Markdown</option>
                <option value="asciidoc">AsciiDoc</option>
                <option value="html">HTML</option>
                <option value="pdf">PDF</option>
                <option value="yaml">YAML</option>
                <option value="json">JSON</option>
                <option value="txt">Texte</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="grid">
        {swapped ? resultCard : sourceCard}

        <div className="swap-column">
          <button
            type="button"
            className="swap-button"
            onClick={() => setSwapped((v) => !v)}
          >
            <span className="swap-icon">{swapped ? "⇦⇨" : "⇨⇦"}</span>
          </button>
        </div>

        {swapped ? sourceCard : resultCard}
      </main>

      <footer className="footer">
        Make by TBE
      </footer>

      {/* Modale de confirmation pour l'édition */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Activer le mode édition</h3>
            <p>Voulez-vous activer le mode édition pour modifier le contenu ?</p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  // Sauvegarder le contenu original avant d'activer l'édition
                  if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json') {
                    setOriginalMdOutput(mdOutput);
                  } else {
                    setOriginalAdocInput(adocInput);
                  }
                  setIsEditingResult(true);
                  setShowEditModal(false);
                }}
                style={{ 
                  background: "#10b981",
                  flex: 1
                }}
              >
                Oui
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ 
                  background: "#ef4444",
                  flex: 1
                }}
              >
                Non
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation pour la sauvegarde */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Sauvegarder les modifications</h3>
            <p>Voulez-vous sauvegarder les modifications apportées au contenu ?</p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  setIsEditingResult(false);
                  setShowSaveModal(false);
                  setStatus("Modifications sauvegardées ✓");
                  setTimeout(() => setStatus(""), 3000);
                }}
                style={{ 
                  background: "#10b981",
                  flex: 1
                }}
              >
                Oui
              </button>
              <button
                onClick={() => {
                  // Restaurer le contenu original et désactiver l'édition
                  if (visualMode === 'adoc-to-md') {
                    setMdOutput(originalMdOutput);
                  } else {
                    setAdocInput(originalAdocInput);
                  }
                  setIsEditingResult(false);
                  setShowSaveModal(false);
                  setStatus("Édition annulée - modifications non sauvegardées");
                }}
                style={{ 
                  background: "#ef4444",
                  flex: 1
                }}
              >
                Non
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation pour l'annulation */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Annuler l'édition</h3>
            <p>Voulez-vous annuler l'édition ? Toutes les modifications non sauvegardées seront perdues.</p>
            <div className="modal-buttons">
              <button
                onClick={() => {
                  // Annuler les modifications et restaurer le contenu original
                  if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt') {
                    setMdOutput(originalMdOutput);
                  } else {
                    setAdocInput(originalAdocInput);
                  }
                  setIsEditingResult(false);
                  setShowCancelModal(false);
                  setStatus("Édition annulée - modifications non sauvegardées");
                }}
                style={{ 
                  background: "#10b981",
                  flex: 1
                }}
              >
                Oui
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ 
                  background: "#ef4444",
                  flex: 1
                }}
              >
                Non
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation pour l'effacement du résultat */}
      {showClearResultModal && (
        <div className="modal-overlay" onClick={() => setShowClearResultModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Effacer le résultat</h3>
            <p>Voulez-vous effacer le résultat ? Cette action est irréversible.</p>
            <div className="modal-buttons">
              <button
                onClick={confirmClearResult}
                style={{ 
                  background: "#10b981",
                  flex: 1
                }}
              >
                Oui
              </button>
              <button
                onClick={() => setShowClearResultModal(false)}
                style={{ 
                  background: "#ef4444",
                  flex: 1
                }}
              >
                Non
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation pour l'effacement de la source */}
      {showClearSourceModal && (
        <div className="modal-overlay" onClick={() => setShowClearSourceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Effacer la source</h3>
            <p>Que voulez-vous effacer ?</p>
            <div className="modal-buttons" style={{ flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={confirmClearSource}
                style={{ 
                  background: "#10b981",
                  width: "100%"
                }}
              >
                Oui - Source uniquement
              </button>
              <button
                onClick={confirmClearSourceAndResult}
                style={{ 
                  background: "#10b981",
                  width: "100%"
                }}
              >
                Oui - Source et résultat
              </button>
              <button
                onClick={() => setShowClearSourceModal(false)}
                style={{ 
                  background: "#ef4444",
                  width: "100%"
                }}
              >
                Non
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


