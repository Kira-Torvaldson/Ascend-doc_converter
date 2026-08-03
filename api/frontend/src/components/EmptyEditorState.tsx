type EmptyEditorStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Visual tone: source invites input; result waits for conversion */
  variant?: 'source' | 'result';
};

/**
 * Overlay shown when an editor panel has no content.
 * Non-interactive except for the optional CTA (pointer-events).
 */
export function EmptyEditorState({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'source',
}: EmptyEditorStateProps) {
  return (
    <div className={`editor-empty-state editor-empty-state--${variant}`} aria-hidden="true">
      <div className="editor-empty-state-card">
        <span className="editor-empty-state-mark" aria-hidden="true">
          {variant === 'result' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M16 10l3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
        <p className="editor-empty-state-title">{title}</p>
        <p className="editor-empty-state-desc">{description}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            className="editor-empty-state-action"
            onClick={onAction}
            tabIndex={-1}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
