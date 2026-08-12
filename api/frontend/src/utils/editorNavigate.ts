/**
 * Navigation / scroll dans les textareas éditeur (goto line, sync proportionnelle).
 */

export function countTextLines(text: string): number {
  if (!text) return 1;
  let n = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) n++;
  }
  return n;
}

/** Plage [start, end) d’une ligne 1-based dans `text`. */
export function getLineRange(
  text: string,
  line1Based: number
): { start: number; end: number; lineIndex: number; totalLines: number } {
  const totalLines = countTextLines(text);
  const lineIndex = Math.min(Math.max(1, Math.floor(line1Based) || 1), totalLines) - 1;
  const lines = text.split('\n');
  const start = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
  const end = start + (lines[lineIndex] || '').length;
  return { start, end, lineIndex, totalLines };
}

/** Index de ligne 1-based à partir d’un offset caractère. */
export function lineNumberAtOffset(text: string, offset: number): number {
  const at = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  for (let i = 0; i < at; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

export function syncScrollRatio(
  from: HTMLTextAreaElement,
  to: HTMLTextAreaElement
): void {
  const fromMax = Math.max(1, from.scrollHeight - from.clientHeight);
  const toMax = Math.max(0, to.scrollHeight - to.clientHeight);
  to.scrollTop = (from.scrollTop / fromMax) * toMax;
}

/** Focus, sélectionne la ligne et scroll pour la centrer approximativement. */
export function scrollTextareaToLine(
  textarea: HTMLTextAreaElement | null | undefined,
  line1Based: number
): boolean {
  if (!textarea) return false;
  const { start, end, lineIndex } = getLineRange(textarea.value, line1Based);
  try {
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(start, end);
    const style = window.getComputedStyle(textarea);
    const lineHeight =
      parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.65 || 20;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    textarea.scrollTop = Math.max(0, lineIndex * lineHeight + paddingTop - lineHeight * 2);
    return true;
  } catch {
    return false;
  }
}
