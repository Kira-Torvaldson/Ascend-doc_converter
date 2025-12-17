"""
Script pour démarrer le serveur FastAPI avec uvicorn.
Configure les limites pour gérer de gros fichiers.

Pour démarrer le serveur, exécutez:
    python start_server.py

Ou directement avec uvicorn:
    uvicorn api:app --host 0.0.0.0 --port 3003 --reload
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=3003,
        reload=True,
        limit_concurrency=100,
        timeout_keep_alive=30,
        # Note: La limite de taille du body par défaut est 1MB dans Starlette
        # Pour les fichiers plus gros, il faut modifier le code ou utiliser
        # une approche différente (streaming, etc.)
    )

