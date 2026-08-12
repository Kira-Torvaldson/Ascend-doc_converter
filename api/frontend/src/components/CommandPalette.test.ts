import { describe, expect, it } from 'vitest';
import { filterCommandItems, type CommandPaletteItem } from '../components/CommandPalette';

const items: CommandPaletteItem[] = [
  { id: 'convert', label: 'Convertir', keywords: 'run go', run: () => {} },
  { id: 'find', label: 'Rechercher', keywords: 'search', run: () => {} },
  { id: 'goto', label: 'Aller à la ligne', keywords: 'line', run: () => {} },
];

describe('filterCommandItems', () => {
  it('returns all when query empty', () => {
    expect(filterCommandItems(items, '')).toHaveLength(3);
  });

  it('matches label without accents', () => {
    expect(filterCommandItems(items, 'rechercher').map((i) => i.id)).toEqual(['find']);
  });

  it('matches keywords and multi-token', () => {
    expect(filterCommandItems(items, 'all ligne').map((i) => i.id)).toEqual(['goto']);
    expect(filterCommandItems(items, 'run').map((i) => i.id)).toEqual(['convert']);
  });
});
