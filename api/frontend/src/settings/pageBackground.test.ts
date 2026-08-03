import { describe, it, expect, beforeEach } from 'vitest';
import {
  PAGE_BG_IMAGE_KEY,
  loadCustomPageBackground,
  persistCustomPageBackground,
} from './pageBackground'

function installMemoryLocalStorage() {
  const store = new Map<string, string>()
  const memory = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
    writable: true,
  })
}

describe('pageBackground storage', () => {
  beforeEach(() => {
    installMemoryLocalStorage()
  })

  it('returns null when empty', () => {
    expect(loadCustomPageBackground()).toBeNull()
  })

  it('persists and loads a data URL image', () => {
    const dataUrl = 'data:image/png;base64,abc'
    persistCustomPageBackground(dataUrl)
    expect(loadCustomPageBackground()).toBe(dataUrl)
  })

  it('clears stored image', () => {
    persistCustomPageBackground('data:image/jpeg;base64,xyz')
    persistCustomPageBackground(null)
    expect(loadCustomPageBackground()).toBeNull()
  })

  it('ignores non-image payloads', () => {
    localStorage.setItem(PAGE_BG_IMAGE_KEY, 'https://example.com/x.jpg')
    expect(loadCustomPageBackground()).toBeNull()
  })
})
