/**
 * Custom page background image (data URL) — stored separately from user settings JSON.
 */

export const PAGE_BG_IMAGE_KEY = 'ascend_page_bg_image';
export const SERVER_BG_URL = '/public/rafale.jpg';
/** Soft cap after compression to stay within localStorage limits */
export const MAX_PAGE_BG_DATA_URL_CHARS = 2_800_000;
export const MAX_PAGE_BG_SOURCE_BYTES = 8 * 1024 * 1024;

/** Target longest edge: screen size × DPR (capped), never upscale the source. */
function targetMaxEdge(): number {
  if (typeof window === 'undefined') return 2560;
  const screenEdge = Math.max(window.screen?.width || 0, window.screen?.height || 0, 1280);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return Math.min(3840, Math.max(1920, Math.round(screenEdge * dpr)));
}

export type BackgroundMode = 'default' | 'server' | 'custom';

export function loadCustomPageBackground(): string | null {
  try {
    const value = localStorage.getItem(PAGE_BG_IMAGE_KEY);
    if (value && value.startsWith('data:image/')) return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function persistCustomPageBackground(dataUrl: string | null): void {
  try {
    if (!dataUrl) {
      localStorage.removeItem(PAGE_BG_IMAGE_KEY);
      return;
    }
    localStorage.setItem(PAGE_BG_IMAGE_KEY, dataUrl);
  } catch (e) {
    console.error('Error saving page background:', e);
    throw new Error('Impossible d’enregistrer l’image (stockage plein ou bloqué).');
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = src;
  });
}

/**
 * Reads an image file and returns a compressed JPEG/PNG data URL suitable for localStorage.
 */
export async function fileToPageBackgroundDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choisissez un fichier image (JPG, PNG, WebP…).');
  }
  if (file.size > MAX_PAGE_BG_SOURCE_BYTES) {
    throw new Error('Image trop volumineuse (max 8 Mo).');
  }

  const rawUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(rawUrl);
    // Downscale only when larger than the display target — never enlarge (évite le flou).
    const maxEdge = targetMaxEdge();
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Compression impossible');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const preferPng = file.type === 'image/png' && file.size < 400_000 && scale === 1;
    let dataUrl = preferPng
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', 0.9);

    if (dataUrl.length > MAX_PAGE_BG_DATA_URL_CHARS) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    }
    if (dataUrl.length > MAX_PAGE_BG_DATA_URL_CHARS) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    }
    if (dataUrl.length > MAX_PAGE_BG_DATA_URL_CHARS) {
      throw new Error('Image trop lourde après compression. Essayez une photo plus petite.');
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(rawUrl);
  }
}

export function applyPageBackgroundToDocument(
  mode: BackgroundMode,
  customDataUrl: string | null
): void {
  const root = document.documentElement;

  if (mode === 'custom' && customDataUrl) {
    root.classList.add('page-custom-bg');
    root.style.setProperty('--page-bg-image', `url("${customDataUrl}")`);
    return;
  }

  if (mode === 'server') {
    root.classList.add('page-custom-bg');
    root.style.setProperty('--page-bg-image', `url("${SERVER_BG_URL}")`);
    return;
  }

  root.classList.remove('page-custom-bg');
  root.style.removeProperty('--page-bg-image');
}
