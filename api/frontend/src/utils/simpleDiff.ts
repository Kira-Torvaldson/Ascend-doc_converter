/**
 * Diff ligne à ligne (LCS) pour aperçu source ↔ résultat.
 */

export type DiffKind = 'same' | 'add' | 'del';

export interface DiffLine {
  kind: DiffKind;
  text: string;
  leftNo?: number;
  rightNo?: number;
}

/** Au-delà de ce produit n×m, on évite la matrice LCS (freeze UI). */
export const DIFF_LCS_CELL_LIMIT = 1_200_000;

/** Nombre max de lignes rendues dans le panneau (DOM). */
export const DIFF_RENDER_LIMIT = 3_500;

export type DiffLinesResult = {
  lines: DiffLine[];
  truncated: boolean;
  added: number;
  removed: number;
};

function naiveLineDiff(a: string[], b: string[]): DiffLine[] {
  const out: DiffLine[] = [];
  const n = a.length;
  const m = b.length;
  const max = Math.max(n, m);
  let leftNo = 1;
  let rightNo = 1;
  for (let k = 0; k < max; k++) {
    const left = k < n ? a[k] : undefined;
    const right = k < m ? b[k] : undefined;
    if (left !== undefined && right !== undefined && left === right) {
      out.push({ kind: 'same', text: left, leftNo: leftNo++, rightNo: rightNo++ });
    } else {
      if (left !== undefined) out.push({ kind: 'del', text: left, leftNo: leftNo++ });
      if (right !== undefined) out.push({ kind: 'add', text: right, rightNo: rightNo++ });
    }
  }
  return out;
}

function summarize(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].kind === 'add') added++;
    else if (lines[i].kind === 'del') removed++;
  }
  return { added, removed };
}

export function diffLines(left: string, right: string): DiffLinesResult {
  const a = left.replace(/\r\n/g, '\n').split('\n');
  const b = right.replace(/\r\n/g, '\n').split('\n');
  const n = a.length;
  const m = b.length;

  if (n === 0 && m === 0) {
    return { lines: [], truncated: false, added: 0, removed: 0 };
  }

  if (n * m > DIFF_LCS_CELL_LIMIT) {
    const lines = naiveLineDiff(a, b);
    return { lines, truncated: true, ...summarize(lines) };
  }

  // Matrice aplatie Int32 : moins d’allocations que number[][].
  const cols = m + 1;
  const dp = new Int32Array((n + 1) * cols);

  for (let i = n - 1; i >= 0; i--) {
    const row = i * cols;
    const rowBelow = (i + 1) * cols;
    for (let j = m - 1; j >= 0; j--) {
      dp[row + j] =
        a[i] === b[j] ? dp[rowBelow + j + 1] + 1 : Math.max(dp[rowBelow + j], dp[row + j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let leftNo = 1;
  let rightNo = 1;
  let added = 0;
  let removed = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i], leftNo: leftNo++, rightNo: rightNo++ });
      i++;
      j++;
    } else if (dp[(i + 1) * cols + j] >= dp[i * cols + j + 1]) {
      out.push({ kind: 'del', text: a[i], leftNo: leftNo++ });
      removed++;
      i++;
    } else {
      out.push({ kind: 'add', text: b[j], rightNo: rightNo++ });
      added++;
      j++;
    }
  }
  while (i < n) {
    out.push({ kind: 'del', text: a[i++], leftNo: leftNo++ });
    removed++;
  }
  while (j < m) {
    out.push({ kind: 'add', text: b[j++], rightNo: rightNo++ });
    added++;
  }
  return { lines: out, truncated: false, added, removed };
}
