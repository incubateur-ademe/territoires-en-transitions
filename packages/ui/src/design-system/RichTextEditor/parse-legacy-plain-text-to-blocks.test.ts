import { describe, expect, it } from 'vitest';
import {
  isLegacyPlainText,
  parseLegacyPlainTextToBlocks,
} from './parse-legacy-plain-text-to-blocks';

describe('isLegacyPlainText', () => {
  it('retourne true pour du texte brut sans syntaxe Markdown', () => {
    expect(isLegacyPlainText('ligne 1\nligne 2')).toBe(true);
  });

  it('retourne false pour du HTML ou du Markdown', () => {
    expect(isLegacyPlainText('<p>html</p>')).toBe(false);
    expect(isLegacyPlainText('**gras**')).toBe(false);
  });
});

describe('parseLegacyPlainTextToBlocks', () => {
  it('crée un paragraphe par ligne', () => {
    expect(parseLegacyPlainTextToBlocks('ligne 1\nligne 2')).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'ligne 1', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'ligne 2', styles: {} }],
      },
    ]);
  });

  it('insère un paragraphe vide entre deux sections séparées par une ligne vide', () => {
    expect(
      parseLegacyPlainTextToBlocks(
        'parking A\nparking B\nparking C\n\nVISITE 2025'
      )
    ).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'parking A', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'parking B', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'parking C', styles: {} }],
      },
      { type: 'paragraph' },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'VISITE 2025', styles: {} }],
      },
    ]);
  });

  it('insère un paragraphe vide entre deux lignes seules', () => {
    expect(
      parseLegacyPlainTextToBlocks('sur la ZAE du Rival\n\nVISITE 2025')
    ).toEqual([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'sur la ZAE du Rival', styles: {} },
        ],
      },
      { type: 'paragraph' },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'VISITE 2025', styles: {} }],
      },
    ]);
  });
});
