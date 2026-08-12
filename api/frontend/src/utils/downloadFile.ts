/**
 * Download helpers for Ascend UI (history JSON, metrics CSV).
 */

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
  downloadTextFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
}

export function toCsvRow(cells: Array<string | number>): string {
  return cells
    .map((c) => {
      const s = String(c);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(',');
}
