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

  const [swapped, setSwapped] = useState<boolean>(false);
  const [conversionMode, setConversionMode] = useState<'adoc-to-md' | 'md-to-adoc'>('adoc-to-md');
  // Mode visuel pour déterminer quels panneaux afficher (change avec les flèches)
  const [visualMode, setVisualMode] = useState<'adoc-to-md' | 'md-to-adoc'>('adoc-to-md');

  const adocTextAreaRef = useRef<HTMLTextAreaElement | null>(null);


  // Extraction des titres AsciiDoc (=, ==, etc.) et Markdown (#, ##, etc.) pour naviguer dans le fichier
  const headings = useMemo(() => {
    // Utiliser le texte selon le mode visuel
    const text = visualMode === 'adoc-to-md' ? adocInput : mdOutput;
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
  }, [adocInput, mdOutput, visualMode]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      // Utiliser visualMode pour déterminer où mettre le texte
      if (visualMode === 'adoc-to-md') {
        setAdocInput(text);
      } else {
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
        // Utiliser visualMode pour déterminer où mettre le texte
        if (visualMode === 'adoc-to-md') {
          setAdocInput(text);
        } else {
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
    // Copier le texte du résultat selon le mode visuel actuel
    const textToCopy = visualMode === 'adoc-to-md' ? mdOutput : adocInput;
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
    if (conversionMode === 'adoc-to-md') {
      setMdOutput("");
    } else {
      setAdocInput("");
    }
    setStatus("Résultat effacé");
  };

  const handleClearAdoc = () => {
    setAdocInput("");
    setCurrentFileName(null);
    setImportedFiles([]);
    setFolderFiles([]);
    setSelectedFileIndex(-1);
    setStatus("Contenu AsciiDoc effacé");
  };

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

  // Callbacks de conversion avec useCallback pour éviter les problèmes de closure
  const handleConvertAdocToMd = useCallback(() => {
    setConversionMode('adoc-to-md');
    const currentValue = adocTextAreaRef.current?.value || adocInput;
    if (!currentValue.trim()) {
      setStatus("Veuillez entrer du texte à convertir");
      return;
    }
    convertAsciiDocToMarkdown(
      currentValue,
      setStatus,
      setMdOutput,
      setLoading
    );
  }, [adocInput]);

  const handleConvertMdToAdoc = useCallback(() => {
    setConversionMode('md-to-adoc');
    setSwapped(false);
    if (!mdOutput.trim()) {
      setStatus("Veuillez entrer du texte à convertir");
      return;
    }
    convertMarkdownToAsciiDoc(
      mdOutput,
      setStatus,
      setAdocInput,
      setLoading,
      setConversionMode
    );
  }, [mdOutput]);

  // Composant réutilisable pour le panneau source
  const renderSourcePanel = (
    title: string,
    value: string,
    setValue: (value: string) => void,
    placeholder: string,
    textAreaRef: React.RefObject<HTMLTextAreaElement> | null,
    conversionMode: 'adoc-to-md' | 'md-to-adoc',
    onConvert: () => void,
    showHeadings: boolean = false
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
          {title === 'AsciiDoc' && (
            <button
              onClick={handleClearAdoc}
              disabled={!adocInput.trim()}
              style={{
                fontSize: "0.85rem",
                padding: "0.4rem 0.9rem",
                background: "#ef4444"
              }}
              title="Effacer le contenu AsciiDoc"
            >
              🗑️ 
            </button>
          )}
          <button
            onClick={onConvert}
            disabled={loading || (conversionMode === 'md-to-adoc' && !value.trim())}
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

  // Panneau source : change selon le mode visuel (pour l'affichage)
  const sourceCard = useMemo(() => {
    if (visualMode === 'adoc-to-md') {
      return renderSourcePanel(
        'AsciiDoc',
        adocInput,
        setAdocInput,
        'Texte AsciiDoc...',
        adocTextAreaRef,
        'adoc-to-md',
        handleConvertAdocToMd,
        true // Afficher les headings pour AsciiDoc
      );
    } else {
      return renderSourcePanel(
        'Markdown',
        mdOutput,
        setMdOutput,
        'Texte Markdown...',
        null,
        'md-to-adoc',
        handleConvertMdToAdoc,
        true // Afficher les headings pour Markdown aussi
      );
    }
  }, [visualMode, adocInput, mdOutput, currentFileName, status, headings, loading, folderFiles, selectedFileIndex, handleConvertAdocToMd, handleConvertMdToAdoc]);

  // Panneau résultat : change selon le mode visuel (pour l'affichage)
  const resultCard = useMemo(() => visualMode === 'adoc-to-md' ? (
    <section className="panel">
      <div className="panel-header">
        <h2>Markdown</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {mdOutput && (
            <>
              <button
                onClick={handleCopy}
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
                title="Copier le résultat"
              >
                {copied ? "✓ Copié" : "📋 Copier"}
              </button>
              <button
                onClick={handleClear}
                style={{ 
                  fontSize: "0.85rem", 
                  padding: "0.4rem 0.9rem",
                  background: "#ef4444"
                }}
                title="Effacer le résultat"
              >
                🗑️ Effacer
              </button>
            </>
          )}
        </div>
      </div>
      <textarea
        value={mdOutput}
        readOnly
        placeholder="Résultat Markdown..."
      />
    </section>
  ) : (
    <section className="panel">
      <div className="panel-header">
        <h2>AsciiDoc</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Pas de boutons d'import dans le panneau résultat */}
          {adocInput && (
            <>
              <button
                onClick={() => {
                  // Changer seulement le mode visuel pour afficher les bons panneaux
                  setVisualMode('adoc-to-md');
                  setSwapped(false); // Remettre sourceCard à gauche
                }}
                disabled={loading}
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
                title="Préparer la conversion vers Markdown"
              >
                ➡️ Vers Markdown
              </button>
              <button
                onClick={handleCopy}
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
                title="Copier le résultat"
              >
                {copied ? "✓ Copié" : "📋 Copier"}
              </button>
              <button
                onClick={handleClear}
                style={{ 
                  fontSize: "0.85rem", 
                  padding: "0.4rem 0.9rem",
                  background: "#ef4444"
                }}
                title="Effacer le résultat"
              >
                🗑️ Effacer
              </button>
            </>
          )}
        </div>
      </div>
      <textarea
        value={adocInput}
        readOnly
        placeholder="Résultat AsciiDoc..."
      />
    </section>
  ), [visualMode, adocInput, mdOutput, status, loading, copied]);

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
              <h1>Ascend - AsciiDoc to Markdown</h1>
             
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
        AsciiDoc ⇄ Markdown · Converter
      </footer>
    </div>
  );
}

export default App;


