/**
 * Piège le focus Tab dans un conteneur (dialogs / fenêtres flottantes).
 */

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options?: { initialFocusRef?: RefObject<HTMLElement | null> }
): void {
  useEffect(() => {
    if (!active) return;

    const root = containerRef.current;
    if (!root) return;

    const previous = document.activeElement as HTMLElement | null;
    const initial = options?.initialFocusRef?.current;
    const nodes = visibleFocusables(root);
    (initial && root.contains(initial) ? initial : nodes[0])?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const tabNodes = visibleFocusables(containerRef.current);
      if (tabNodes.length === 0) return;

      const first = tabNodes[0];
      const last = tabNodes[tabNodes.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeEl === first || !containerRef.current.contains(activeEl)) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !containerRef.current.contains(activeEl)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (previous && typeof previous.focus === 'function') {
        previous.focus();
      }
    };
  }, [active, containerRef, options?.initialFocusRef]);
}
