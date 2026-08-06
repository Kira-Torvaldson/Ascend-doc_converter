/**
 * ============================================================================
 * COMPONENT: Modal - Confirmation Ascend (Escape, focus trap, thèmes)
 * ============================================================================
 */

import React, { useEffect, useId, useRef } from 'react';
import { useT } from '../i18n/LocaleContext';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'danger';
  /** Prefer confirm button for destructive defaults when true */
  autoFocusConfirm?: boolean;
  /** Hide the cancel button (e.g. error ack) */
  showCancel?: boolean;
  /** Replace default footer buttons */
  footer?: React.ReactNode;
  /** Extra class on dialog panel */
  contentClassName?: string;
  /** Stack footer buttons vertically */
  stackActions?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'info',
  autoFocusConfirm = false,
  showCancel = true,
  footer,
  contentClassName,
  stackActions = false,
}) => {
  const t = useT();
  const resolvedConfirm = confirmText ?? t('common.confirm');
  const resolvedCancel = cancelText ?? t('common.cancel');
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const nodes = dialogRef.current
      ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];

    const focusTarget =
      (autoFocusConfirm && confirmRef.current) ||
      cancelRef.current ||
      confirmRef.current ||
      nodes[0];
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const tabNodes = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (tabNodes.length === 0) return;

      const first = tabNodes[0];
      const last = tabNodes[tabNodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      previousFocusRef.current?.focus?.();
    };
    // Intentionally omit handlers: bind once per open cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoFocusConfirm]);

  if (!isOpen) return null;

  const panelClass = [
    'modal-content',
    `modal-content--${type}`,
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const footerClass = [
    'modal-footer',
    'modal-buttons',
    stackActions ? 'modal-buttons--stack' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="modal-overlay modal-overlay--elevated"
      onClick={handleCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
        </div>
        <div className="modal-body" id={descId}>
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className={footerClass}>
          {footer ?? (
            <>
              {showCancel && (
                <button
                  ref={cancelRef}
                  type="button"
                  className="modal-button cancel"
                  onClick={handleCancel}
                >
                  {resolvedCancel}
                </button>
              )}
              {onConfirm && (
                <button
                  ref={confirmRef}
                  type="button"
                  className={`modal-button confirm ${type}`}
                  onClick={handleConfirm}
                >
                  {resolvedConfirm}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
