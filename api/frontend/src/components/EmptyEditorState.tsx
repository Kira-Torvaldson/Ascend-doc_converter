type EmptyEditorStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Visual tone: source invites input; result waits for conversion */
  variant?: 'source' | 'result';
  /** Pour le résultat : en attente de source, ou prêt à convertir. */
  resultMode?: 'waiting' | 'ready';
};

function SourceIllustration() {
  return (
    <svg className="editor-empty-illu" viewBox="0 0 160 100" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="emptySrcPaper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="86" rx="48" ry="6" fill="currentColor" opacity="0.08" />
      <rect x="38" y="12" width="72" height="68" rx="8" fill="url(#emptySrcPaper)" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <path d="M86 12v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.45" />
      <path d="M52 42h44M52 52h36M52 62h28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
      <g className="editor-empty-illu-float">
        <rect x="108" y="28" width="34" height="28" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
        <path d="M119 38v12M125 44H113" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
      </g>
      <path
        d="M28 58c0-6 4-10 10-10h8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.35"
      />
      <circle cx="26" cy="58" r="3" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function ResultIllustration({ ready }: { ready: boolean }) {
  return (
    <svg className="editor-empty-illu" viewBox="0 0 160 100" fill="none" aria-hidden="true">
      <ellipse cx="80" cy="86" rx="48" ry="6" fill="currentColor" opacity="0.08" />
      <rect x="18" y="22" width="42" height="52" rx="7" stroke="currentColor" strokeWidth="1.5" opacity="0.35" fill="currentColor" fillOpacity="0.06" />
      <path d="M28 36h22M28 46h16M28 56h20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.28" />
      <path
        className={ready ? 'editor-empty-illu-arrow is-ready' : 'editor-empty-illu-arrow'}
        d="M68 48h24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={ready ? 0.65 : 0.3}
      />
      <path
        d="M86 40l10 8-10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={ready ? 0.65 : 0.3}
      />
      <rect
        x="100"
        y="18"
        width="46"
        height="58"
        rx="8"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity={ready ? 0.55 : 0.28}
        fill="currentColor"
        fillOpacity={ready ? 0.1 : 0.04}
      />
      {ready ? (
        <path d="M112 40h22M112 50h18M112 60h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      ) : (
        <path d="M112 48h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" opacity="0.3" />
      )}
    </svg>
  );
}

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
  resultMode = 'waiting',
}: EmptyEditorStateProps) {
  const ready = variant === 'result' && resultMode === 'ready';

  return (
    <div
      className={`editor-empty-state editor-empty-state--${variant}${ready ? ' is-ready' : ''}`}
      aria-hidden="true"
    >
      <div className="editor-empty-state-glow" aria-hidden="true" />
      <div className="editor-empty-state-card">
        <div className="editor-empty-state-illu-wrap">
          {variant === 'result' ? <ResultIllustration ready={ready} /> : <SourceIllustration />}
        </div>
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
