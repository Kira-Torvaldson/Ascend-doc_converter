/**
 * Pied de page Ascend.
 */

import React from 'react';

interface AppFooterProps {
  version: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({ version }) => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-group footer-group--brand">
        <span className="footer-brand">© Ascend</span>
        <span className="footer-version">v{version}</span>
      </div>
      <div className="footer-group footer-group--meta">
        <span className="footer-license">MIT License</span>
        <span className="footer-note">Future versions may use a different licensing model</span>
      </div>
      <div className="footer-group footer-group--author">
        <span className="footer-author-text">Made by TBE</span>
      </div>
    </div>
  </footer>
);
