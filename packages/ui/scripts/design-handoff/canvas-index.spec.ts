import { describe, expect, it } from 'vitest';
import {
  parseBundleHeader,
  parseCanvasIndex,
  proposalsOf,
} from './canvas-index.ts';

describe('parseCanvasIndex', () => {
  const index = parseCanvasIndex(
    JSON.stringify({
      v: 3,
      boards: {
        'Main.dc.html': { x: 0, y: 0, w: 1280, h: 800, title: 'Page plan' },
        'Etat-vide.dc.html': { x: 0, y: 900, w: 1280, h: 800 },
      },
      notes: {
        a: { x: 0, y: 0, text: 'Proposition : une jauge de progression' },
        b: { x: 0, y: 0, text: 'Flows' },
      },
      designSystems: [
        { title: 'TeT', namespace: 'tet', artifact: 'x', version: 'v7' },
        { title: 'Autre', namespace: 'autre', version: null },
      ],
    })
  );

  it('lit le titre des artboards qui en ont un', () => {
    expect(index.boardTitles).toEqual({ 'Main.dc.html': 'Page plan' });
  });

  it('lit le texte des notes', () => {
    expect(index.noteTexts).toEqual([
      'Proposition : une jauge de progression',
      'Flows',
    ]);
  });

  it('lit les copies de design system, version absente comprise', () => {
    expect(index.designSystems).toEqual([
      { namespace: 'tet', version: 'v7' },
      { namespace: 'autre', version: undefined },
    ]);
  });

  it('tolère un index sans artboards, notes ni design system', () => {
    expect(parseCanvasIndex('{}')).toEqual({
      boardTitles: {},
      noteTexts: [],
      designSystems: [],
    });
  });
});

describe('proposalsOf', () => {
  it('ne garde que les notes « Proposition : … »', () => {
    expect(
      proposalsOf([
        ' proposition : un graphe en aires',
        'Flows',
        'Propositions',
      ])
    ).toEqual(['proposition : un graphe en aires']);
  });
});

describe('parseBundleHeader', () => {
  it('lit l’espace de noms et les composants du bundle', () => {
    const header = parseBundleHeader(
      '/* @ds-bundle: {"format":4,"namespace":"TeT","components":[{"name":"Button"},{"name":"Badge"}]} */\n(function(){})();'
    );
    expect(header?.namespace).toBe('TeT');
    expect([...(header?.componentNames ?? [])]).toEqual(['Button', 'Badge']);
  });

  it('rend undefined quand la première ligne n’est pas un en-tête', () => {
    expect(parseBundleHeader('(function(){})();')).toBeUndefined();
  });
});
