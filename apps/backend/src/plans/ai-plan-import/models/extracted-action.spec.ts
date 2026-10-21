import { describe, expect, it } from 'vitest';
import {
  axisPathOf,
  createEmptyExtractedAction,
  sousAxeLabelOf,
  withAxisPath,
} from './extracted-action';

describe('axisPathOf', () => {
  it("prend l'axe et le sous-axe, sans segment vide, sans chemin complet", () => {
    expect(
      axisPathOf(createEmptyExtractedAction({ axe: ' Mobilité ', sousAxe: '' }))
    ).toEqual(['Mobilité']);
    expect(
      axisPathOf(createEmptyExtractedAction({ axe: '', sousAxe: 'Vélo' }))
    ).toEqual(['Vélo']);
  });

  it('prend le chemin complet quand il existe', () => {
    const action = withAxisPath(createEmptyExtractedAction(), [
      'Ambition 1',
      'Objectif 1.1',
      'Objectif 1.1.2',
    ]);

    expect(axisPathOf(action)).toEqual([
      'Ambition 1',
      'Objectif 1.1',
      'Objectif 1.1.2',
    ]);
  });
});

describe('withAxisPath', () => {
  it("garde l'axe et le sous-axe égaux aux deux premiers segments", () => {
    const action = withAxisPath(
      createEmptyExtractedAction({ axe: 'Ancien', sousAxe: 'Ancien sous-axe' }),
      [' Ambition 1 ', '', 'Objectif 1.1', 'Objectif 1.1.2']
    );

    expect(action).toMatchObject({
      axe: 'Ambition 1',
      sousAxe: 'Objectif 1.1',
      cheminAxes: ['Ambition 1', 'Objectif 1.1', 'Objectif 1.1.2'],
    });
  });

  it('vide axe et sous-axe pour un chemin vide', () => {
    const action = withAxisPath(
      createEmptyExtractedAction({ axe: 'Ancien', sousAxe: 'Ancien sous-axe' }),
      []
    );

    expect(action).toMatchObject({ axe: '', sousAxe: '', cheminAxes: [] });
  });
});

describe('sousAxeLabelOf', () => {
  it('lit les niveaux sous l’axe comme un seul sous-axe', () => {
    const action = withAxisPath(createEmptyExtractedAction(), [
      'Ambition 1',
      'Objectif 1.1',
      'Objectif 1.1.2',
    ]);

    expect(sousAxeLabelOf(action)).toBe('Objectif 1.1 > Objectif 1.1.2');
    expect(
      sousAxeLabelOf(createEmptyExtractedAction({ axe: 'A', sousAxe: 'B ' }))
    ).toBe('B ');
  });
});
