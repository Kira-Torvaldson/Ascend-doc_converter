import { useMemo, useRef, useState, useCallback, useEffect } from "react";

const API_BASE = "http://localhost:3003";

async function convertAsciiDocToMarkdown(
  text: string,
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void
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

async function convertMarkdownToAsciiDoc(
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

// Fonction de conversion générique selon les formats source et destination
async function convertText(
  text: string,
  sourceFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  targetFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void,
  conversionOptions?: any
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
      // Inclure les options si Parsedown est activé
      if (conversionOptions?.formatSpecific?.markdown?.parsedown) {
        body = { text, options: conversionOptions };
      }
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
      body = { text, from: sourceFormat, to: targetFormat, options: conversionOptions };
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

function App() {
  const [adocInput, setAdocInput] = useState<string>("");
  const [mdOutput, setMdOutput] = useState<string>("");

  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [justConverted, setJustConverted] = useState<boolean>(false);
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
  
  // État pour contrôler l'affichage de la navigation
  const [navigationEnabled, setNavigationEnabled] = useState<boolean>(true);
  const [navigationWindowOpen, setNavigationWindowOpen] = useState<boolean>(false);
  const [navigationWindowMinimized, setNavigationWindowMinimized] = useState<boolean>(false);
  const [navigationWindowMaximized, setNavigationWindowMaximized] = useState<boolean>(false);
  const [navigationWindowPosition, setNavigationWindowPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [navigationWindowSize, setNavigationWindowSize] = useState<{ width: number; height: number }>({ width: 500, height: 400 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const navigationWindowRef = useRef<HTMLDivElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  
  // Options de conversion
  type ConversionOptions = {
    contentAnalysis?: {
      analysisMode?: 'basic' | 'heuristic' | 'strict';
      headingDetection?: {
        enabled?: boolean;
        detectAllCaps?: boolean;
        detectSeparators?: boolean;
        detectNumbering?: boolean;
      };
      listDetection?: {
        enabled?: boolean;
        detectBullets?: boolean;
        detectNumbered?: boolean;
        normalizeIndentation?: boolean;
      };
    };
    normalization?: {
      encoding?: 'utf-8' | 'latin1' | 'ascii';
      lineBreaks?: {
        normalize?: boolean;
        target?: 'unix' | 'windows' | 'mac';
      };
      tabs?: {
        convertToSpaces?: boolean;
        tabSize?: number;
      };
      advanced?: {
        unicode?: {
          normalization?: 'none' | 'NFC' | 'NFKC';
          detectConfusables?: boolean;
          confusablesAction?: 'none' | 'warn' | 'replace';
        };
        characterCleaning?: {
          removeControlChars?: boolean;
          removeDirectionalChars?: boolean;
          removeNonPrintableChars?: boolean;
          preserveWhitespace?: boolean;
        };
        transliteration?: {
          strategy?: 'none' | 'simple' | 'configurable';
          enableTransliteration?: boolean;
          unicodeToAscii?: {
            enabled?: boolean;
            method?: 'remove' | 'replace' | 'transliterate';
            replacementChar?: string;
          };
        };
        validation?: {
          rejectInvalidSequences?: boolean;
          rejectPrivateChars?: boolean;
          warnOutOfRange?: boolean;
          allowedRanges?: Array<{start: number, end: number}>;
        };
        processingMode?: {
          mode?: 'strict' | 'tolerant';
          throwOnError?: boolean;
          logWarnings?: boolean;
          continueOnWarning?: boolean;
        };
      };
    };
    rendering?: {
      tableOfContents?: {
        enabled?: boolean;
        depth?: number;
      };
      sectionNumbering?: {
        enabled?: boolean;
        depth?: number;
      };
      lineWrap?: {
        enabled?: boolean;
        maxWidth?: number;
      };
    };
    formatSpecific?: {
      markdown?: {
        flavor?: 'commonmark' | 'gfm' | 'markdown';
        parsedown?: boolean; // Compatibilité Parsedown (BookStack)
      };
      asciidoc?: {
        compatMode?: 'asciidoctor' | 'asciidoc';
      };
    };
    security?: {
      maxFileSize?: number;
      conversionTimeout?: number;
    };
    metadata?: {
      title?: string | null;
      author?: string | null;
      language?: string;
    };
    developer?: {
      debugMode?: boolean;
    };
  };
  
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  
  const updateOption = (path: string[], value: any) => {
    setConversionOptions(prev => {
      const newOptions = { ...prev };
      let current: any = newOptions;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newOptions;
    });
  };
  
  // État pour les notifications
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  } | null>(null);

  // Fermeture automatique de la notification après 10 secondes
  useEffect(() => {
    if (notification && notification.visible) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000); // 10 secondes

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const adocTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const mdTextAreaRef = useRef<HTMLTextAreaElement | null>(null);


  // Extraction des titres AsciiDoc (=, ==, etc.) et Markdown (#, ##, etc.) pour naviguer dans le fichier
  // IMPORTANT: Utiliser uniquement le texte du panneau SOURCE, jamais le résultat
  const headings = useMemo(() => {
    // Ne pas extraire les headings si le format source n'est pas AsciiDoc ou Markdown
    if (sourceFormat !== 'asciidoc' && sourceFormat !== 'markdown') {
      return [];
    }
    
    // Utiliser le texte selon le format source - uniquement depuis le panneau source
    let text = "";
    if (sourceFormat === 'asciidoc') {
      // Pour AsciiDoc, utiliser adocInput seulement si targetFormat n'est pas asciidoc
      // (sinon adocInput pourrait être le résultat d'une conversion)
      if (targetFormat === 'asciidoc' && mdOutput.trim().length > 0) {
        // Si targetFormat est asciidoc et qu'il y a du texte dans mdOutput,
        // alors adocInput est probablement le résultat, donc on ne l'utilise pas
        return [];
      }
      text = adocInput;
    } else if (sourceFormat === 'markdown') {
      // Pour Markdown, utiliser mdOutput seulement si targetFormat n'est pas markdown
      // (sinon mdOutput est le résultat d'une conversion)
      if (targetFormat === 'markdown' && adocInput.trim().length > 0) {
        // Si targetFormat est markdown et qu'il y a du texte dans adocInput,
        // alors mdOutput est probablement le résultat, donc on ne l'utilise pas
        return [];
      }
      text = mdOutput;
    }
    
    if (!text || text.trim().length === 0) return [];
    
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
  }, [adocInput, mdOutput, sourceFormat, targetFormat]);

  // Ouvrir automatiquement la fenêtre de navigation si la navigation est activée et qu'il y a du texte avec des headings
  // IMPORTANT: Ne s'ouvre que pour le format SOURCE, jamais pour le résultat
  useEffect(() => {
    // Ne pas ouvrir la fenêtre si une conversion vient d'avoir lieu
    if (justConverted || loading) {
      setNavigationWindowOpen(false);
      return;
    }
    
    if (navigationEnabled && (sourceFormat === 'asciidoc' || sourceFormat === 'markdown')) {
      // Utiliser uniquement le texte du panneau source
      let text = "";
      if (sourceFormat === 'asciidoc') {
        // Pour AsciiDoc, ne pas utiliser adocInput si c'est le résultat de conversion
        if (targetFormat === 'asciidoc' && mdOutput.trim().length > 0) {
          // adocInput est le résultat, donc on ne fait rien
          setNavigationWindowOpen(false);
          return;
        }
        text = adocInput;
      } else if (sourceFormat === 'markdown') {
        // Pour Markdown, ne pas utiliser mdOutput si c'est le résultat de conversion
        if (targetFormat === 'markdown' && adocInput.trim().length > 0) {
          // mdOutput est le résultat, donc on ne fait rien
          setNavigationWindowOpen(false);
          return;
        }
        text = mdOutput;
      }
      
      const hasText = text.trim().length > 0;
      const hasHeadings = headings.length > 0;
      
      // Debug: afficher les valeurs pour comprendre pourquoi la fenêtre ne s'ouvre pas
      console.log('Navigation Debug:', {
        navigationEnabled,
        sourceFormat,
        hasText,
        hasHeadings,
        headingsCount: headings.length,
        textLength: text.length,
        adocInputLength: adocInput.length,
        mdOutputLength: mdOutput.length
      });
      
      if (hasText && hasHeadings) {
        console.log('Ouverture de la fenêtre de navigation');
        // Centrer la fenêtre à l'ouverture si elle n'a pas encore de position
        if (navigationWindowPosition.x === 0 && navigationWindowPosition.y === 0) {
          setNavigationWindowPosition({
            x: (window.innerWidth - navigationWindowSize.width) / 2,
            y: (window.innerHeight - navigationWindowSize.height) / 2
          });
        }
        // S'assurer que la fenêtre n'est pas en mode réduit quand elle s'ouvre
        setNavigationWindowMinimized(false);
        setNavigationWindowOpen(true);
      } else {
        console.log('Fermeture de la fenêtre de navigation - conditions non remplies');
        setNavigationWindowOpen(false);
      }
    } else {
      console.log('Fermeture de la fenêtre de navigation - navigation désactivée ou format incorrect');
      setNavigationWindowOpen(false);
    }
  }, [navigationEnabled, sourceFormat, targetFormat, adocInput, mdOutput, headings, justConverted, loading]);

  // Gestionnaires pour le déplacement de la fenêtre
  const handleDragStart = (e: React.MouseEvent) => {
    if (navigationWindowMaximized || !navigationWindowRef.current) return;
    const rect = navigationWindowRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || navigationWindowMaximized) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Calculer l'offset par rapport à la position de base
    const offsetX = newX - navigationWindowPosition.x;
    const offsetY = newY - navigationWindowPosition.y;
    
    // Limiter la position aux limites de l'écran
    const maxX = window.innerWidth - navigationWindowSize.width;
    const maxY = window.innerHeight - (navigationWindowMinimized ? 60 : navigationWindowSize.height);
    
    const clampedOffsetX = Math.max(-navigationWindowPosition.x, Math.min(offsetX, maxX - navigationWindowPosition.x));
    const clampedOffsetY = Math.max(-navigationWindowPosition.y, Math.min(offsetY, maxY - navigationWindowPosition.y));
    
    setDragOffset({
      x: clampedOffsetX,
      y: clampedOffsetY
    });
  }, [isDragging, dragStart, navigationWindowMaximized, navigationWindowMinimized, navigationWindowSize, navigationWindowPosition]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      // Appliquer l'offset à la position finale
      const maxX = window.innerWidth - navigationWindowSize.width;
      const maxY = window.innerHeight - (navigationWindowMinimized ? 60 : navigationWindowSize.height);
      
      setNavigationWindowPosition({
        x: Math.max(0, Math.min(navigationWindowPosition.x + dragOffset.x, maxX)),
        y: Math.max(0, Math.min(navigationWindowPosition.y + dragOffset.y, maxY))
      });
      setDragOffset({ x: 0, y: 0 });
    }
    setIsDragging(false);
  }, [isDragging, dragOffset, navigationWindowPosition, navigationWindowSize, navigationWindowMinimized]);

  // Gestionnaires pour le redimensionnement de la fenêtre
  const handleResizeStart = (e: React.MouseEvent) => {
    if (navigationWindowMaximized || navigationWindowMinimized) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: navigationWindowSize.width,
      height: navigationWindowSize.height
    });
  };

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || navigationWindowMaximized || navigationWindowMinimized) return;
    
    requestAnimationFrame(() => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const minWidth = 300;
      const minHeight = 200;
      const maxWidth = window.innerWidth - navigationWindowPosition.x;
      const maxHeight = window.innerHeight - navigationWindowPosition.y;
      
      setNavigationWindowSize({
        width: Math.max(minWidth, Math.min(resizeStart.width + deltaX, maxWidth)),
        height: Math.max(minHeight, Math.min(resizeStart.height + deltaY, maxHeight))
      });
    });
  }, [isResizing, resizeStart, navigationWindowMaximized, navigationWindowMinimized, navigationWindowPosition]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Ajouter les écouteurs d'événements pour le drag et resize
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

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
    // Utiliser la bonne ref selon le format source
    const textarea = sourceFormat === 'asciidoc' ? adocTextAreaRef.current : 
                     sourceFormat === 'markdown' ? mdTextAreaRef.current : 
                     adocTextAreaRef.current;
    if (!textarea) return;

    // Utiliser le texte selon le format source
    const text = sourceFormat === 'asciidoc' ? adocInput : (sourceFormat === 'markdown' ? mdOutput : adocInput);
    const lines = text.split("\n");
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

    setJustConverted(true);
    convertText(
      sourceText,
      sourceFormat,
      targetFormat,
      setStatus,
      setOutput,
      setLoading,
      setNotification,
      conversionOptions
    );
    // Réinitialiser le flag après un court délai pour éviter l'ouverture de la fenêtre
    setTimeout(() => setJustConverted(false), 2000);
  }, [sourceFormat, targetFormat, adocInput, mdOutput, conversionOptions, setNotification]);

  // Fonction pour inverser les formats source et destination
  const handleSwap = useCallback(() => {
    // Inverser les formats
    const newSourceFormat = targetFormat;
    const newTargetFormat = sourceFormat;
    
    // Récupérer le contenu actuel selon les formats
    let currentSourceText = "";
    let currentTargetText = "";
    
    // Récupérer le texte source actuel
    if (sourceFormat === 'asciidoc' || sourceFormat === 'html' || sourceFormat === 'pdf' || sourceFormat === 'yaml' || sourceFormat === 'json' || sourceFormat === 'txt') {
      currentSourceText = adocInput;
    } else if (sourceFormat === 'markdown') {
      currentSourceText = mdOutput;
    }
    
    // Récupérer le texte de destination actuel
    if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt') {
      currentTargetText = mdOutput;
    } else if (targetFormat === 'asciidoc') {
      currentTargetText = adocInput;
    }
    
    // Inverser les formats
    setSourceFormat(newSourceFormat);
    setTargetFormat(newTargetFormat);
    
    // Inverser le contenu : l'ancien résultat devient la nouvelle source, l'ancienne source devient le nouveau résultat
    // Nouveau panneau source (ancien panneau destination)
    if (newSourceFormat === 'asciidoc' || newSourceFormat === 'html' || newSourceFormat === 'pdf' || newSourceFormat === 'yaml' || newSourceFormat === 'json' || newSourceFormat === 'txt') {
      setAdocInput(currentTargetText);
    } else if (newSourceFormat === 'markdown') {
      setMdOutput(currentTargetText);
    }
    
    // Nouveau panneau destination (ancien panneau source)
    if (newTargetFormat === 'markdown' || newTargetFormat === 'html' || newTargetFormat === 'pdf' || newTargetFormat === 'yaml' || newTargetFormat === 'json' || newTargetFormat === 'txt') {
      setMdOutput(currentSourceText);
    } else if (newTargetFormat === 'asciidoc') {
      setAdocInput(currentSourceText);
    }
    
    // Note: Le panneau source reste toujours à gauche et le résultat à droite
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
      sourceRef = mdTextAreaRef;
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
      (sourceFormat === 'asciidoc' || sourceFormat === 'markdown'), // Afficher les headings pour AsciiDoc et Markdown
      sourceFormat !== targetFormat, // Peut convertir si formats différents
      handleClearSource // Fonction pour effacer le contenu source
    );
  }, [sourceFormat, adocInput, mdOutput, currentFileName, status, headings, loading, folderFiles, selectedFileIndex, handleConvert, getFormatTitle, getFormatPlaceholder, adocTextAreaRef, navigationEnabled]);

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
      {notification && notification.visible && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}
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
          <button
            type="button"
            className="settings-button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Paramètres"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01131 9.77251C4.28062 9.5799 4.48571 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </header>
      
      {/* Panneau de paramètres */}
      {settingsOpen && (
        <>
          <div className="settings-overlay" onClick={() => setSettingsOpen(false)} />
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-panel-header">
              <h3>Paramètres</h3>
              <button
                type="button"
                className="settings-close-btn"
                onClick={() => setSettingsOpen(false)}
                title="Fermer"
              >
                ×
              </button>
            </div>
            <div className="settings-panel-content">
              <div className="settings-section">
                <h4>Paramètres de l'application</h4>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
                  Les paramètres seront disponibles prochainement.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Options de conversion</h3>
            <div className="sidebar-content">
              <div className="format-selector-group">
                <label className="format-label">Format source</label>
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
                  className="format-select"
                >
                  <option value="asciidoc">adoc</option>
                  <option value="markdown">md</option>
                  <option value="html">html</option>
                  <option value="pdf">pdf</option>
                  <option value="yaml">yaml</option>
                  <option value="json">json</option>
                  <option value="txt">txt</option>
                </select>
              </div>
              <div className="format-selector-group">
                <label className="format-label">Format destination</label>
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
                  className="format-select"
                >
                  <option value="markdown">md</option>
                  <option value="asciidoc">adoc</option>
                  <option value="html">html</option>
                  <option value="pdf">pdf</option>
                  <option value="yaml">yaml</option>
                  <option value="json">json</option>
                  <option value="txt">txt</option>
                </select>
              </div>
            </div>
          </div>
          <div className="sidebar-section">
            <h3 className="sidebar-title">Autres options</h3>
            <div className="sidebar-content">
              {/* Navigation dans le fichier */}
              {(sourceFormat === 'asciidoc' || sourceFormat === 'markdown') && (
                <div className="option-section">
                  <button
                    type="button"
                    className="option-section-header"
                    onClick={() => toggleSection('navigation')}
                  >
                    <span>Navigation</span>
                    <span className="option-section-arrow">
                      {expandedSections.has('navigation') ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.has('navigation') && (
                    <div className="option-section-content">
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={navigationEnabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setNavigationEnabled(enabled);
                              // Ouvrir la fenêtre si activée et qu'il y a du texte
                              if (enabled) {
                                const text = sourceFormat === 'asciidoc' ? adocInput : (sourceFormat === 'markdown' ? mdOutput : adocInput);
                                const hasText = text.trim().length > 0;
                                if (hasText && headings.length > 0) {
                                  setNavigationWindowOpen(true);
                                }
                              } else {
                                setNavigationWindowOpen(false);
                              }
                            }}
                            className="option-checkbox"
                          />
                          <span>Activer la navigation</span>
                          {headings.length > 0 && (
                            <span className="navigation-count">{headings.length} {headings.length > 1 ? 'sections' : 'section'}</span>
                          )}
                        </label>
                      </div>
                      {headings.length === 0 && (
                        <div style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                          fontStyle: "italic",
                          margin: 0,
                          padding: "0.75rem",
                          textAlign: "center",
                          background: "rgba(255, 255, 255, 0.05)",
                          borderRadius: "0.5rem"
                        }}>
                          Aucune section disponible. Ajoutez des titres dans votre document pour activer la navigation.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Options de conversion */}
              <div className="conversion-options-container">
                {/* Analyse du contenu */}
                <div className="option-section">
                  <button
                    type="button"
                    className="option-section-header"
                    onClick={() => toggleSection('contentAnalysis')}
                  >
                    <span>Analyse du contenu</span>
                    <span className="option-section-arrow">
                      {expandedSections.has('contentAnalysis') ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.has('contentAnalysis') && (
                    <div className="option-section-content">
                      <div className="option-group">
                        <label className="option-label">Mode d'analyse</label>
                        <select
                          value={conversionOptions.contentAnalysis?.analysisMode || 'heuristic'}
                          onChange={(e) => updateOption(['contentAnalysis', 'analysisMode'], e.target.value)}
                          className="option-select"
                        >
                          <option value="basic">Basique</option>
                          <option value="heuristic">Heuristique</option>
                          <option value="strict">Strict</option>
                        </select>
                      </div>
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={conversionOptions.contentAnalysis?.headingDetection?.enabled !== false}
                            onChange={(e) => updateOption(['contentAnalysis', 'headingDetection', 'enabled'], e.target.checked)}
                            className="option-checkbox"
                          />
                          <span>Détection des titres</span>
                        </label>
                      </div>
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={conversionOptions.contentAnalysis?.listDetection?.enabled !== false}
                            onChange={(e) => updateOption(['contentAnalysis', 'listDetection', 'enabled'], e.target.checked)}
                            className="option-checkbox"
                          />
                          <span>Détection des listes</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Normalisation */}
                <div className="option-section">
                  <button
                    type="button"
                    className="option-section-header"
                    onClick={() => toggleSection('normalization')}
                  >
                    <span>Normalisation</span>
                    <span className="option-section-arrow">
                      {expandedSections.has('normalization') ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.has('normalization') && (
                    <div className="option-section-content">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        <div className="option-group">
                          <label className="option-label">Encodage</label>
                          <select
                            value={conversionOptions.normalization?.encoding || 'utf-8'}
                            onChange={(e) => updateOption(['normalization', 'encoding'], e.target.value)}
                            className="option-select"
                          >
                            <option value="utf-8">UTF-8</option>
                            <option value="latin1">Latin1</option>
                            <option value="ascii">ASCII</option>
                          </select>
                        </div>
                        <div className="option-group">
                          <label className="option-label">Unicode</label>
                          <select
                            value={conversionOptions.normalization?.advanced?.unicode?.normalization || 'NFC'}
                            onChange={(e) => updateOption(['normalization', 'advanced', 'unicode', 'normalization'], e.target.value)}
                            className="option-select"
                          >
                            <option value="none">Désactivée</option>
                            <option value="NFC">NFC</option>
                            <option value="NFKC">NFKC</option>
                          </select>
                        </div>
                      </div>
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={conversionOptions.normalization?.tabs?.convertToSpaces !== false}
                            onChange={(e) => updateOption(['normalization', 'tabs', 'convertToSpaces'], e.target.checked)}
                            className="option-checkbox"
                          />
                          <span>Tabulations → Espaces</span>
                        </label>
                      </div>
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={conversionOptions.normalization?.advanced?.unicode?.detectConfusables !== false}
                            onChange={(e) => updateOption(['normalization', 'advanced', 'unicode', 'detectConfusables'], e.target.checked)}
                            className="option-checkbox"
                          />
                          <span>Détecter confusables</span>
                        </label>
                      </div>
                      <div style={{ 
                        marginTop: '0.75rem', 
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid rgba(229, 231, 235, 0.15)' 
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <label className="option-checkbox-label">
                            <input
                              type="checkbox"
                              checked={conversionOptions.normalization?.advanced?.characterCleaning?.removeControlChars || false}
                              onChange={(e) => updateOption(['normalization', 'advanced', 'characterCleaning', 'removeControlChars'], e.target.checked)}
                              className="option-checkbox"
                            />
                            <span>Contrôle</span>
                          </label>
                          <label className="option-checkbox-label">
                            <input
                              type="checkbox"
                              checked={conversionOptions.normalization?.advanced?.characterCleaning?.removeDirectionalChars || false}
                              onChange={(e) => updateOption(['normalization', 'advanced', 'characterCleaning', 'removeDirectionalChars'], e.target.checked)}
                              className="option-checkbox"
                            />
                            <span>Directionnels</span>
                          </label>
                          <label className="option-checkbox-label">
                            <input
                              type="checkbox"
                              checked={conversionOptions.normalization?.advanced?.characterCleaning?.removeNonPrintableChars || false}
                              onChange={(e) => updateOption(['normalization', 'advanced', 'characterCleaning', 'removeNonPrintableChars'], e.target.checked)}
                              className="option-checkbox"
                            />
                            <span>Non imprimables</span>
                          </label>
                          <label className="option-checkbox-label">
                            <input
                              type="checkbox"
                              checked={conversionOptions.normalization?.advanced?.validation?.rejectInvalidSequences !== false}
                              onChange={(e) => updateOption(['normalization', 'advanced', 'validation', 'rejectInvalidSequences'], e.target.checked)}
                              className="option-checkbox"
                            />
                            <span>Invalides</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rendu documentaire */}
                <div className="option-section">
                  <button
                    type="button"
                    className="option-section-header"
                    onClick={() => toggleSection('rendering')}
                  >
                    <span>Rendu documentaire</span>
                    <span className="option-section-arrow">
                      {expandedSections.has('rendering') ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.has('rendering') && (
                    <div className="option-section-content">
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={conversionOptions.rendering?.tableOfContents?.enabled || false}
                            onChange={(e) => updateOption(['rendering', 'tableOfContents', 'enabled'], e.target.checked)}
                            className="option-checkbox"
                          />
                          <span>Table des matières</span>
                        </label>
                      </div>
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={conversionOptions.rendering?.sectionNumbering?.enabled || false}
                            onChange={(e) => updateOption(['rendering', 'sectionNumbering', 'enabled'], e.target.checked)}
                            className="option-checkbox"
                          />
                          <span>Numérotation des sections</span>
                        </label>
                      </div>
                      <div className="option-group">
                        <label className="option-checkbox-label">
                          <input
                            type="checkbox"
                            checked={conversionOptions.rendering?.lineWrap?.enabled || false}
                            onChange={(e) => updateOption(['rendering', 'lineWrap', 'enabled'], e.target.checked)}
                            className="option-checkbox"
                          />
                          <span>Retour à la ligne automatique</span>
                        </label>
                        {conversionOptions.rendering?.lineWrap?.enabled && (
                          <input
                            type="number"
                            value={conversionOptions.rendering?.lineWrap?.maxWidth || 80}
                            onChange={(e) => updateOption(['rendering', 'lineWrap', 'maxWidth'], parseInt(e.target.value) || 80)}
                            className="option-input"
                            min="40"
                            max="200"
                            placeholder="Largeur max (caractères)"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Options spécifiques au format */}
                <div className="option-section">
                  <button
                    type="button"
                    className="option-section-header"
                    onClick={() => toggleSection('formatSpecific')}
                  >
                    <span>Options format</span>
                    <span className="option-section-arrow">
                      {expandedSections.has('formatSpecific') ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.has('formatSpecific') && (
                    <div className="option-section-content">
                      {targetFormat === 'markdown' && (
                        <div className="option-group">
                          <label className="option-label">Flavor Markdown</label>
                          <select
                            value={
                              conversionOptions.formatSpecific?.markdown?.parsedown 
                                ? 'parsedown' 
                                : (conversionOptions.formatSpecific?.markdown?.flavor || 'commonmark')
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'parsedown') {
                                updateOption(['formatSpecific', 'markdown', 'parsedown'], true);
                                updateOption(['formatSpecific', 'markdown', 'flavor'], 'commonmark');
                              } else {
                                updateOption(['formatSpecific', 'markdown', 'parsedown'], false);
                                updateOption(['formatSpecific', 'markdown', 'flavor'], value);
                              }
                            }}
                            className="option-select"
                          >
                            <option value="commonmark">CommonMark</option>
                            <option value="gfm">GitHub Flavored</option>
                            <option value="markdown">Markdown</option>
                            <option value="parsedown">Parsedown (BookStack)</option>
                          </select>
                        </div>
                      )}
                      {targetFormat === 'asciidoc' && (
                        <div className="option-group">
                          <label className="option-label">Mode compatibilité</label>
                          <select
                            value={conversionOptions.formatSpecific?.asciidoc?.compatMode || 'asciidoctor'}
                            onChange={(e) => updateOption(['formatSpecific', 'asciidoc', 'compatMode'], e.target.value)}
                            className="option-select"
                          >
                            <option value="asciidoctor">Asciidoctor</option>
                            <option value="asciidoc">AsciiDoc</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Métadonnées */}
                <div className="option-section">
                  <button
                    type="button"
                    className="option-section-header"
                    onClick={() => toggleSection('metadata')}
                  >
                    <span>Métadonnées</span>
                    <span className="option-section-arrow">
                      {expandedSections.has('metadata') ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.has('metadata') && (
                    <div className="option-section-content">
                      <div className="option-group">
                        <label className="option-label">Titre</label>
                        <input
                          type="text"
                          value={conversionOptions.metadata?.title || ''}
                          onChange={(e) => updateOption(['metadata', 'title'], e.target.value || null)}
                          className="option-input"
                          placeholder="Titre du document"
                        />
                      </div>
                      <div className="option-group">
                        <label className="option-label">Auteur</label>
                        <input
                          type="text"
                          value={conversionOptions.metadata?.author || ''}
                          onChange={(e) => updateOption(['metadata', 'author'], e.target.value || null)}
                          className="option-input"
                          placeholder="Auteur"
                        />
                      </div>
                      <div className="option-group">
                        <label className="option-label">Langue</label>
                        <select
                          value={conversionOptions.metadata?.language || 'fr'}
                          onChange={(e) => updateOption(['metadata', 'language'], e.target.value)}
                          className="option-select"
                        >
                          <option value="fr">Français</option>
                          <option value="en">Anglais</option>
                          <option value="es">Espagnol</option>
                          <option value="de">Allemand</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className="main-content">
      <main className="grid">
        {sourceCard}

        <div className="swap-column">
          <button
            type="button"
            className="swap-button"
            onClick={handleSwap}
          >
            <span className="swap-icon">⇄</span>
          </button>
        </div>

        {resultCard}
      </main>
        </div>
      </div>

      <footer className="footer">
        <span className="footer-version">Version : 0.0.1alpha - 2026-01-13</span>
        <span className="footer-author">Make by TBE</span>
      </footer>

      {/* Barre de tâches pour les fenêtres réduites */}
      {navigationWindowMinimized && (
        <div className="taskbar">
          <div 
            className="taskbar-item"
            onClick={() => {
              setNavigationWindowMinimized(false);
              setNavigationWindowOpen(true);
            }}
            title="Navigation - Cliquez pour restaurer"
          >
            <span className="taskbar-icon">📋</span>
            <span className="taskbar-label">Navigation</span>
          </div>
        </div>
      )}

      {/* Fenêtre de navigation */}
      {navigationWindowOpen && !navigationWindowMinimized && headings.length > 0 && (() => {
        // Structurer les headings par hiérarchie
        const buildHierarchy = (headings: Array<{ lineIndex: number; level: number; title: string }>) => {
          const result: Array<{
            heading: { lineIndex: number; level: number; title: string };
            children: Array<any>;
          }> = [];
          const stack: Array<any> = [];

          headings.forEach((heading) => {
            const item = { heading, children: [] };
            
            // Retirer les éléments de la pile qui sont au même niveau ou plus profonds
            while (stack.length > 0 && stack[stack.length - 1].heading.level >= heading.level) {
              stack.pop();
            }

            if (stack.length === 0) {
              // Élément de niveau racine
              result.push(item);
            } else {
              // Ajouter comme enfant du dernier élément de la pile
              stack[stack.length - 1].children.push(item);
            }

            stack.push(item);
          });

          return result;
        };

        const hierarchy = buildHierarchy(headings);

        const renderHeading = (item: {
          heading: { lineIndex: number; level: number; title: string };
          children: Array<any>;
        }, depth: number = 0) => {
          const { heading, children } = item;
          const hasChildren = children.length > 0;

          return (
            <li
              key={`${heading.lineIndex}-${heading.title}`}
              className={`file-nav-item file-nav-level-${heading.level}`}
              data-depth={depth}
            >
              <div
                className="file-nav-link"
                onClick={() => scrollToHeading(heading.lineIndex)}
                title={`Ligne ${heading.lineIndex + 1}: ${heading.title}`}
              >
                <span className="file-nav-indicator"></span>
                <span className="file-nav-text">{heading.title}</span>
                <span className="file-nav-line">{heading.lineIndex + 1}</span>
    </div>
              {hasChildren && (
                <ul className="file-nav-children">
                  {children.map((child) => renderHeading(child, depth + 1))}
                </ul>
              )}
            </li>
          );
        };

        return (
          <div 
            ref={navigationWindowRef}
            className={`navigation-window ${navigationWindowMinimized ? 'minimized' : ''} ${navigationWindowMaximized ? 'maximized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
            style={{
              left: navigationWindowMaximized ? '50%' : `${navigationWindowPosition.x}px`,
              top: navigationWindowMaximized ? '50%' : `${navigationWindowPosition.y}px`,
              width: navigationWindowMaximized ? '95vw' : `${navigationWindowSize.width}px`,
              height: navigationWindowMaximized ? '95vh' : (navigationWindowMinimized ? 'auto' : `${navigationWindowSize.height}px`),
              transform: navigationWindowMaximized 
                ? 'translate(-50%, -50%)' 
                : isDragging 
                  ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
                  : 'translate3d(0, 0, 0)'
            }}
          >
            <div 
              className="navigation-window-header"
              onMouseDown={handleDragStart}
            >
              <div className="navigation-window-title">
                <span>Navigation</span>
                <span className="navigation-window-count">{headings.length} {headings.length > 1 ? 'sections' : 'section'}</span>
              </div>
              <div className="navigation-window-controls">
                <button
                  type="button"
                  className="navigation-window-btn minimize-btn"
                  onClick={() => {
                    setNavigationWindowMinimized(true);
                    setNavigationWindowOpen(false);
                  }}
                  title="Réduire"
                >
                  −
                </button>
                <button
                  type="button"
                  className="navigation-window-btn maximize-btn"
                  onClick={() => setNavigationWindowMaximized(!navigationWindowMaximized)}
                  title={navigationWindowMaximized ? "Restaurer" : "Plein écran"}
                >
                  {navigationWindowMaximized ? '⧉' : '□'}
                </button>
                <button
                  type="button"
                  className="navigation-window-btn close-btn"
                  onClick={() => {
                    setNavigationWindowOpen(false);
                    setNavigationEnabled(false);
                  }}
                  title="Fermer"
                >
                  ×
                </button>
              </div>
            </div>
            {!navigationWindowMinimized && (
              <div className="navigation-window-content">
                <div className="file-navigation-container">
                  <ul className="file-navigation-list">
                    {hierarchy.map((item) => renderHeading(item))}
                  </ul>
                </div>
              </div>
            )}
            {!navigationWindowMinimized && !navigationWindowMaximized && (
              <div 
                className="navigation-window-resize-handle"
                onMouseDown={handleResizeStart}
              />
            )}
          </div>
        );
      })()}

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


