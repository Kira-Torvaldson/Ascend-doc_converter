import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Global error handling for diagnosing issues
window.addEventListener('error', (event) => {
  console.error('Erreur globale:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesse rejetée non gérée:', event.reason);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Élément root introuvable dans le DOM");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Erreur lors du rendu de l'application:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Erreur de chargement</h1>
      <p>Une erreur s'est produite lors du chargement de l'application.</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${error instanceof Error ? error.message : String(error)}</pre>
      <p>Veuillez vérifier la console du navigateur pour plus de détails.</p>
    </div>
  `;
}


