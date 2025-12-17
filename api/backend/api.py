from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import logging
import subprocess
import os
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Chemin vers le répertoire racine du projet (où se trouve package.json)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def asciidoc_to_markdown(text: str) -> str:
    """
    Convertit du texte AsciiDoc en Markdown en utilisant convert.js.
    convert.js utilise downdoc (lib/index.js) et bookstack-adapter.js pour la conversion.
    """
    try:
        # S'assurer que le texte d'entrée est bien une chaîne UTF-8
        if isinstance(text, bytes):
            text = text.decode('utf-8', errors='replace')
        
        # Encoder le texte en base64 pour le passer via un argument de ligne de commande
        # Cela évite les problèmes de lecture stdin et les caractères spéciaux
        text_b64 = base64.b64encode(text.encode('utf-8')).decode('ascii')
        
        # Créer un script Node.js qui utilise convert.js
        # Le script sera exécuté depuis PROJECT_ROOT, donc on peut utiliser un chemin relatif
        # Passer les données via un argument base64 pour éviter les problèmes stdin
        script = f"""
const {{ convertAsciiDoc }} = require('./api/convert.js');
try {{
  // Décoder les données depuis l'argument base64
  const input = Buffer.from('{text_b64}', 'base64').toString('utf8');
  convertAsciiDoc(input, 'default')
    .then(output => {{
      process.stdout.write(output);
    }})
    .catch(error => {{
      process.stderr.write(error.message || String(error));
      process.exit(1);
    }});
}} catch (error) {{
  process.stderr.write(error.message || String(error));
  process.exit(1);
}}
"""
        
        # Trouver Node.js avec plusieurs méthodes
        node_path = _find_node_executable()
        if not node_path:
            logger.error("Node.js n'est pas installé ou n'est pas accessible")
            raise RuntimeError("Erreur de conversion: Node.js n'est pas installé ou n'est pas accessible. Veuillez installer Node.js (https://nodejs.org/) pour utiliser cette fonctionnalité.")
        
        # Vérifier que convert.js existe
        convert_js_path = os.path.join(PROJECT_ROOT, 'api', 'convert.js')
        if not os.path.exists(convert_js_path):
            logger.error(f"convert.js non trouvé à: {convert_js_path}")
            raise RuntimeError(f"Erreur de conversion: Fichier convert.js non trouvé à {convert_js_path}")
        
        # Normaliser le chemin pour Node.js (utiliser des slashes)
        convert_js_path_normalized = convert_js_path.replace('\\', '/')
        
        # Mettre à jour le script pour utiliser le chemin absolu
        script = f"""
const convertPath = '{convert_js_path_normalized}';
const {{ convertAsciiDoc }} = require(convertPath);
try {{
  // Décoder les données depuis l'argument base64
  const input = Buffer.from('{text_b64}', 'base64').toString('utf8');
  convertAsciiDoc(input, 'default')
    .then(output => {{
      process.stdout.write(output);
    }})
    .catch(error => {{
      process.stderr.write(error.message || String(error));
      process.exit(1);
    }});
}} catch (error) {{
  process.stderr.write(error.message || String(error));
  process.exit(1);
}}
"""
        
        logger.info(f"Utilisation de Node.js à: {node_path} pour la conversion AsciiDoc -> Markdown avec downdoc")
        
        # Exécuter Node.js avec le script
        # Spécifier explicitement UTF-8 pour éviter les problèmes d'encodage sur Windows
        # Utiliser shell=True sur Windows si node_path est juste 'node' (pas un chemin complet)
        import platform
        use_shell = platform.system() == 'Windows' and (node_path == 'node' or not os.path.isabs(node_path))
        
        # Si use_shell est True, utiliser une commande shell, sinon utiliser la liste
        if use_shell:
            # Échapper les guillemets pour la commande shell
            script_escaped = script.replace('"', '\\"').replace('\n', ' ')
            cmd = f'{node_path} -e "{script_escaped}"'
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                encoding='utf-8',
                errors='replace',
                cwd=PROJECT_ROOT,
                shell=True
            )
        else:
            process = subprocess.Popen(
                [node_path, '-e', script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                encoding='utf-8',
                errors='replace',
                cwd=PROJECT_ROOT,
                shell=False
            )
        
        stdout, stderr = process.communicate(timeout=30)
        
        if process.returncode != 0:
            error_msg = stderr or "Erreur inconnue lors de la conversion"
            logger.error(f"Erreur convert.js (downdoc): {error_msg}")
            raise RuntimeError(f"Erreur de conversion: {error_msg}")
        
        # convert.js peut ajouter un '\n' à la fin, on le retire si présent
        return stdout.rstrip('\n')
    except subprocess.TimeoutExpired:
        logger.error("Timeout lors de la conversion AsciiDoc -> Markdown")
        raise RuntimeError("Erreur de conversion: Timeout - la conversion prend trop de temps")
    except FileNotFoundError as e:
        logger.error(f"Node.js non trouvé: {str(e)}")
        raise RuntimeError("Erreur de conversion: Node.js n'est pas installé ou n'est pas accessible. Veuillez installer Node.js (https://nodejs.org/) pour utiliser cette fonctionnalité.")
    except RuntimeError:
        # Re-lancer les RuntimeError telles quelles
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la conversion AsciiDoc -> Markdown: {str(e)}")
        raise RuntimeError(f"Erreur de conversion: {str(e)}")


def _check_pandoc_available() -> bool:
    """Vérifie si Pandoc est disponible sur le système."""
    try:
        process = subprocess.Popen(
            ['pandoc', '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding='utf-8',
            errors='replace'
        )
        process.communicate(timeout=5)
        return process.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _find_node_executable() -> str:
    """Trouve le chemin de l'exécutable Node.js."""
    import shutil
    import platform
    
    # Méthode 1: Utiliser shutil.which
    node_path = shutil.which('node')
    if node_path:
        logger.info(f"Node.js trouvé via shutil.which: {node_path}")
        return node_path
    
    # Méthode 2: Essayer avec subprocess pour voir si node est dans le PATH
    try:
        process = subprocess.Popen(
            ['node', '--version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding='utf-8',
            errors='replace',
            shell=False
        )
        stdout, stderr = process.communicate(timeout=5)
        if process.returncode == 0:
            logger.info(f"Node.js version détectée via subprocess: {stdout.strip()}")
            return 'node'  # Retourner 'node' car il fonctionne
    except Exception:
        pass
    
    # Méthode 3: Chercher dans les emplacements communs sur Windows
    if platform.system() == 'Windows':
        common_paths = [
            os.path.join(os.environ.get('ProgramFiles', ''), 'nodejs', 'node.exe'),
            os.path.join(os.environ.get('ProgramFiles(x86)', ''), 'nodejs', 'node.exe'),
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Programs', 'nodejs', 'node.exe'),
            os.path.expanduser('~\\AppData\\Roaming\\npm\\node.exe'),
            'C:\\Program Files\\nodejs\\node.exe',
            'C:\\Program Files (x86)\\nodejs\\node.exe',
        ]
        for path in common_paths:
            if path and os.path.exists(path):
                logger.info(f"Node.js trouvé dans un emplacement commun: {path}")
                return path
        
        # Méthode 4: Chercher dans le PATH système Windows
        try:
            import winreg
            # Lire le PATH depuis le registre Windows
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment") as key:
                system_path = winreg.QueryValueEx(key, "PATH")[0]
                for path_dir in system_path.split(';'):
                    if path_dir:
                        node_exe = os.path.join(path_dir, 'node.exe')
                        if os.path.exists(node_exe):
                            logger.info(f"Node.js trouvé dans le PATH système: {node_exe}")
                            return node_exe
        except Exception as e:
            logger.debug(f"Impossible de lire le PATH système: {str(e)}")
    
    # Si rien ne fonctionne, retourner None
    logger.error("Node.js non trouvé avec toutes les méthodes")
    return None


def _check_node_available() -> bool:
    """Vérifie si Node.js est disponible sur le système."""
    node_path = _find_node_executable()
    return node_path is not None


def markdown_to_asciidoc(text: str) -> str:
    """
    Convertit du texte Markdown en AsciiDoc.
    Essaie d'abord Pandoc (plus fiable), puis utilise convert.js en fallback.
    """
    try:
        # S'assurer que le texte d'entrée est bien une chaîne UTF-8
        if isinstance(text, bytes):
            text = text.decode('utf-8', errors='replace')
        
        if not text or not text.strip():
            raise RuntimeError("Le texte à convertir est vide")
        
        # Essayer d'abord avec Pandoc (plus fiable)
        if _check_pandoc_available():
            try:
                logger.info("Utilisation de Pandoc pour la conversion Markdown -> AsciiDoc")
                process = subprocess.Popen(
                    ['pandoc', '-f', 'markdown', '-t', 'asciidoc', '--wrap=none'],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    encoding='utf-8',
                    errors='replace'
                )
                
                stdout, stderr = process.communicate(input=text, timeout=30)
                
                if process.returncode == 0:
                    result = stdout.rstrip('\n')
                    if result:
                        logger.info("Conversion réussie avec Pandoc")
                        return result
                    else:
                        logger.warning("Pandoc a retourné un résultat vide, utilisation du fallback")
                else:
                    logger.warning(f"Pandoc a échoué: {stderr}, utilisation du fallback")
            except subprocess.TimeoutExpired:
                logger.warning("Timeout avec Pandoc, utilisation du fallback")
            except Exception as e:
                logger.warning(f"Erreur avec Pandoc: {str(e)}, utilisation du fallback")
        else:
            logger.info("Pandoc non disponible, utilisation de convert.js")
        
        # Fallback: utiliser convert.js (fonction améliorée)
        # Vérifier d'abord si Node.js est disponible
        if not _check_node_available():
            logger.error("Node.js n'est pas installé ou n'est pas dans le PATH")
            raise RuntimeError("Erreur de conversion: Node.js n'est pas installé ou n'est pas accessible. Veuillez installer Node.js (https://nodejs.org/) ou Pandoc (https://pandoc.org/installing.html) pour utiliser cette fonctionnalité.")
        
        logger.info("Utilisation de convert.js pour la conversion Markdown -> AsciiDoc")
        text_b64 = base64.b64encode(text.encode('utf-8')).decode('ascii')
        
        # Vérifier que convert.js existe
        convert_js_path = os.path.join(PROJECT_ROOT, 'api', 'convert.js')
        if not os.path.exists(convert_js_path):
            logger.error(f"convert.js non trouvé à: {convert_js_path}")
            raise RuntimeError(f"Erreur de conversion: Fichier convert.js non trouvé à {convert_js_path}")
        
        # Normaliser le chemin pour Node.js (utiliser des slashes)
        convert_js_path_normalized = convert_js_path.replace('\\', '/')
        
        script = f"""
const convertPath = '{convert_js_path_normalized}';
const {{ convertMarkdown }} = require(convertPath);
try {{
  const input = Buffer.from('{text_b64}', 'base64').toString('utf8');
  const output = convertMarkdown(input);
  process.stdout.write(output);
}} catch (error) {{
  process.stderr.write(error.message || String(error));
  process.exit(1);
}}
"""
        
        try:
            # Trouver Node.js avec plusieurs méthodes
            node_path = _find_node_executable()
            if not node_path:
                raise FileNotFoundError("Node.js non trouvé")
            
            logger.info(f"Utilisation de Node.js à: {node_path}")
            # Utiliser shell=True sur Windows si node_path est juste 'node' (pas un chemin complet)
            import platform
            use_shell = platform.system() == 'Windows' and (node_path == 'node' or not os.path.isabs(node_path))
            
            # Si use_shell est True, utiliser une commande shell, sinon utiliser la liste
            if use_shell:
                # Échapper les guillemets pour la commande shell
                script_escaped = script.replace('"', '\\"').replace('\n', ' ')
                cmd = f'{node_path} -e "{script_escaped}"'
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    encoding='utf-8',
                    errors='replace',
                    cwd=PROJECT_ROOT,
                    shell=True
                )
            else:
                process = subprocess.Popen(
                    [node_path, '-e', script],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    encoding='utf-8',
                    errors='replace',
                    cwd=PROJECT_ROOT,
                    shell=False
                )
            
            stdout, stderr = process.communicate(timeout=30)
            
            if process.returncode != 0:
                error_msg = stderr or "Erreur inconnue lors de la conversion"
                logger.error(f"Erreur convert.js: {error_msg}")
                raise RuntimeError(f"Erreur de conversion: {error_msg}")
            
            return stdout.rstrip('\n')
        except FileNotFoundError as e:
            logger.error(f"Node.js non trouvé: {str(e)}")
            raise RuntimeError("Erreur de conversion: Node.js n'est pas installé ou n'est pas accessible. Veuillez installer Node.js (https://nodejs.org/) ou Pandoc (https://pandoc.org/installing.html) pour utiliser cette fonctionnalité.")
        
    except subprocess.TimeoutExpired:
        logger.error("Timeout lors de la conversion Markdown -> AsciiDoc")
        raise RuntimeError("Erreur de conversion: Timeout - la conversion prend trop de temps")
    except RuntimeError:
        # Re-lancer les RuntimeError telles quelles
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la conversion Markdown -> AsciiDoc: {str(e)}")
        raise RuntimeError(f"Erreur de conversion: {str(e)}")


app = FastAPI(
    title="AsciiDoc ⇄ Markdown API", 
    version="1.0.0",
    # Note: Pour augmenter la limite de taille du body au-delà de 1MB (défaut),
    # démarrer uvicorn avec: uvicorn api:app --limit-max-requests 1000
    # ou utiliser: uvicorn api:app --limit-max-requests 1000 --timeout-keep-alive 30
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextPayload(BaseModel):
    text: str


@app.get("/", response_class=HTMLResponse)
def root():
    """
    Page HTML simple si on appelle directement l'API dans un navigateur.
    """
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()


@app.post("/to-markdown")
def to_markdown(payload: TextPayload):
    """
    Convertit du AsciiDoc vers du Markdown.
    """
    try:
        if not payload.text or not payload.text.strip():
            raise HTTPException(status_code=400, detail="Le texte à convertir est vide")
        
        logger.info(f"Conversion de {len(payload.text)} caractères")
        markdown = asciidoc_to_markdown(payload.text)
        return {"markdown": markdown}
    except Exception as e:
        logger.error(f"Erreur lors de la conversion: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la conversion: {str(e)}")


@app.post("/to-asciidoc")
def to_asciidoc(payload: TextPayload):
    """
    Convertit du Markdown vers du AsciiDoc.
    """
    try:
        if not payload.text or not payload.text.strip():
            raise HTTPException(status_code=400, detail="Le texte à convertir est vide")
        
        logger.info(f"Conversion de {len(payload.text)} caractères")
        asciidoc = markdown_to_asciidoc(payload.text)
        return {"asciidoc": asciidoc}
    except Exception as e:
        logger.error(f"Erreur lors de la conversion: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la conversion: {str(e)}")


app.mount("/static", StaticFiles(directory="static"), name="static")
# Dossier public pour les images : api/backend/public → accessible via /public
app.mount("/public", StaticFiles(directory="public"), name="public")


