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

export function diffLines(left: string, right: string): DiffLine[] {
  const a = left.replace(/\r\n/g, '\n').split('\n');
  const b = right.replace(/\r\n/g, '\n').split('\n');
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let leftNo = 1;
  let rightNo = 1;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i], leftNo: leftNo++, rightNo: rightNo++ });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: 'del', text: a[i], leftNo: leftNo++ });
      i++;
    } else {
      out.push({ kind: 'add', text: b[j], rightNo: rightNo++ });
      j++;
    }
  }
  while (i < n) out.push({ kind: 'del', text: a[i++], leftNo: leftNo++ });
  while (j < m) out.push({ kind: 'add', text: b[j++], rightNo: rightNo++ });
  return out;
}
