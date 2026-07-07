# Intégration frontend — Validation de confirmation

## Vue d'ensemble

Le `secure-converter` exige désormais que la confirmation utilisateur soit validée avant d'exécuter une conversion. Cela garantit que l'utilisateur a cliqué sur « Oui » dans une fenêtre de confirmation avant le lancement de la conversion.

## Modification du Secure-Converter

Le module vérifie désormais le paramètre `confirmed: true` dans les options :

```javascript
// ❌ SANS confirmation — sera rejeté
await secureConvert(content, 'markdown', 'asciidoc', {})

// ✅ AVEC confirmation — sera accepté
await secureConvert(content, 'markdown', 'asciidoc', { confirmed: true })
```

## Intégration frontend React

### Étape 1 : Ajouter l'état pour la confirmation

```typescript
const [conversionConfirmed, setConversionConfirmed] = useState<boolean>(false);
const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
```

### Étape 2 : Modifier handleConvert pour afficher la modale

```typescript
const handleConvert = useCallback(() => {
  // Vérifier d'abord si nous avons du contenu
  let sourceText = "";
  if (sourceFormat === 'asciidoc') {
    sourceText = adocTextAreaRef.current?.value || adocInput;
  } else if (sourceFormat === 'markdown') {
    sourceText = mdOutput;
  } else {
    sourceText = adocInput;
  }

  if (!sourceText.trim()) {
    setStatus("Veuillez saisir du texte à convertir");
    return;
  }

  // Afficher la modale de confirmation au lieu de convertir directement
  setShowConversionModal(true);
}, [sourceFormat, adocInput, mdOutput]);
```

### Étape 3 : Créer la fonction de confirmation

```typescript
const confirmConversion = useCallback(() => {
  setConversionConfirmed(true);
  setShowConversionModal(false);
  
  // Exécuter la conversion avec confirmed: true
  let sourceText = "";
  if (sourceFormat === 'asciidoc') {
    sourceText = adocTextAreaRef.current?.value || adocInput;
  } else if (sourceFormat === 'markdown') {
    sourceText = mdOutput;
  } else {
    sourceText = adocInput;
  }

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
    conversionOptions,
    true // confirmed: true
  );
  
  setTimeout(() => setJustConverted(false), 2000);
  setConversionConfirmed(false); // Réinitialiser après conversion
}, [sourceFormat, targetFormat, adocInput, mdOutput, conversionOptions]);
```

### Étape 4 : Modifier convertText pour accepter confirmed

```typescript
async function convertText(
  text: string,
  sourceFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  targetFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void,
  conversionOptions?: any,
  confirmed: boolean = false // Nouveau paramètre
) {
  // ... validation existante ...

  // Vérifier la confirmation si utilisation de secure-converter
  if (!confirmed) {
    setStatus("Confirmation requise pour la conversion");
    setNotification({
      message: "Veuillez confirmer la conversion",
      type: 'error',
      visible: true
    });
    return;
  }

  // ... reste du code de conversion ...
  
  // Dans l'appel API, inclure confirmed: true
  const body = {
    text,
    from: sourceFormat,
    to: targetFormat,
    options: conversionOptions,
    confirmed: true // ✅ Confirmation envoyée au backend
  };

  const res = await fetch(`${API_BASE}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  // ... reste du code ...
}
```

### Étape 5 : Ajouter la modale de confirmation dans le JSX

```tsx
{/* Modale de confirmation pour la conversion */}
{showConversionModal && (
  <div className="modal-overlay" onClick={() => setShowConversionModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>Confirmer la conversion</h3>
      <p>
        Voulez-vous convertir de <strong>{getFormatTitle(sourceFormat)}</strong> vers <strong>{getFormatTitle(targetFormat)}</strong> ?
      </p>
      <div className="modal-buttons">
        <button
          onClick={confirmConversion}
          style={{ 
            background: "#10b981", // Vert pour « Oui »
            flex: 1
          }}
        >
          Oui
        </button>
        <button
          onClick={() => setShowConversionModal(false)}
          style={{ 
            background: "#ef4444", // Rouge pour « Non »
            flex: 1
          }}
        >
          Non
        </button>
      </div>
    </div>
  </div>
)}
```

## Modification backend

Dans `api/backend/server.js`, modifier l'endpoint `/convert` pour utiliser secure-converter :

```javascript
const { secureConvert, ConversionError } = require('../secure-converter.js');

app.post('/convert', async (req, res) => {
  try {
    const { text, from, to, options, confirmed } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'Le contenu doit être une chaîne non vide'
      });
    }

    if (!from || !to) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'Les formats from et to sont requis'
      });
    }

    // Vérification de confirmation (OBLIGATOIRE)
    if (confirmed !== true) {
      return res.status(400).json({
        error: true,
        code: 'CONFIRMATION_REQUIRED',
        message: 'La confirmation utilisateur est requise avant d\'exécuter la conversion'
      });
    }

    // Utiliser secure-converter avec confirmation
    const result = await secureConvert(text, from, to, {
      timeout: 30000,
      confirmed: true
    });

    res.json({
      success: true,
      result,
      from,
      to
    });

  } catch (error) {
    if (error instanceof ConversionError) {
      const statusCode = error.code === 'CONFIRMATION_REQUIRED' || 
                        error.code === 'VALIDATION_ERROR' || 
                        error.code === 'FILE_VALIDATION_ERROR'
        ? 400
        : error.code === 'TIMEOUT'
        ? 408
        : 500;

      res.status(statusCode).json(error.toSafeResponse());
    } else {
      console.error('Erreur inattendue :', error);
      res.status(500).json({
        error: true,
        code: 'INTERNAL_ERROR',
        message: 'Une erreur interne s\'est produite'
      });
    }
  }
});
```

## Flux complet

1. **L'utilisateur clique sur « Convertir »**
   - `handleConvert()` est appelé
   - La modale de confirmation s'affiche
   - La conversion n'est PAS encore lancée

2. **L'utilisateur clique sur « Oui » dans la modale**
   - `confirmConversion()` est appelé
   - `confirmed: true` est défini
   - `convertText()` est appelé avec `confirmed: true`
   - L'API est appelée avec `confirmed: true` dans le corps

3. **Le backend reçoit la requête**
   - Vérifie que `confirmed === true`
   - Sinon, renvoie l'erreur `CONFIRMATION_REQUIRED`
   - Si oui, exécute `secureConvert()` avec `confirmed: true`

4. **secure-converter valide**
   - Vérifie que `options.confirmed === true`
   - Sinon, lève une `ConversionError` avec le code `CONFIRMATION_REQUIRED`
   - Si oui, poursuit la conversion

## Sécurité

Cette approche garantit que :
- ✅ Aucune conversion ne peut être exécutée sans confirmation utilisateur
- ✅ La confirmation est vérifiée à deux niveaux (frontend et backend)
- ✅ Le backend refuse toute requête sans `confirmed: true`
- ✅ Secure-converter refuse toute conversion sans confirmation

## Tests

Pour tester :

1. Tenter de convertir sans confirmation → doit échouer
2. Cliquer sur « Oui » dans la modale → la conversion doit réussir
3. Cliquer sur « Non » dans la modale → la conversion ne doit pas être lancée
