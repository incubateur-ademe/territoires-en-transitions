import { describe, expect, it } from 'vitest';
import {
  createUnenrichedSousAction,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { dedupeByTitle, mergeChunkActions } from './merge-chunk-actions';

const anAction = (
  titre: string,
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre,
    ...overrides,
  });

describe('mergeChunkActions', () => {
  it("ajoute les actions d'une tranche avec leur index de tranche", () => {
    const merged = mergeChunkActions(
      { actions: [anAction('A')], chunkIndexByAction: [0] },
      [anAction('B')],
      1
    );

    expect(merged.actions.map((action) => action.titre)).toEqual(['A', 'B']);
    expect(merged.chunkIndexByAction).toEqual([0, 1]);
  });

  it('fusionne une action reprise par le chevauchement, en gardant le plus complet', () => {
    const merged = mergeChunkActions(
      {
        actions: [
          anAction('1.1.3 Rénover les écoles', {
            description: 'Rénover',
            sousActions: [createUnenrichedSousAction('Audit')],
          }),
        ],
        chunkIndexByAction: [0],
      },
      [
        anAction('Rénover les  écoles', {
          description: 'Rénover les douze écoles de la commune',
          personnePilote: 'Service bâtiments',
          sousActions: [
            createUnenrichedSousAction('Audit'),
            createUnenrichedSousAction('Travaux'),
          ],
        }),
      ],
      1
    );

    expect(merged.actions).toHaveLength(1);
    expect(merged.chunkIndexByAction).toEqual([0]);
    const [action] = merged.actions;
    expect(action.titre).toBe('1.1.3 Rénover les écoles');
    expect(action.description).toBe('Rénover les douze écoles de la commune');
    expect(action.personnePilote).toBe('Service bâtiments');
    expect(action.sousActions.map((sousAction) => sousAction.titre)).toEqual([
      'Audit',
      'Travaux',
    ]);
  });

  it("ne fusionne pas une action homonyme d'une tranche plus ancienne", () => {
    const merged = mergeChunkActions(
      {
        actions: [anAction('Sensibiliser'), anAction('B')],
        chunkIndexByAction: [0, 1],
      },
      [anAction('Sensibiliser', { axe: 'Axe 4' })],
      2
    );

    expect(merged.actions).toHaveLength(3);
    expect(merged.chunkIndexByAction).toEqual([0, 1, 2]);
  });
});

describe('dedupeByTitle', () => {
  it('fond les titres identiques à la casse, aux accents et à la ponctuation près, sur la plus complète', () => {
    const deduped = dedupeByTitle({
      actions: [
        anAction('Ancrer l’administration dans l’éco‑responsabilité', {
          axe: '',
        }),
        anAction('Rénover les écoles'),
        anAction('1 ANCRER L’ADMINISTRATION DANS L’ECO-RESPONSABILITE', {
          axe: 'Axe I',
          description: 'Renforcer et rendre visible l’action de la métropole.',
        }),
      ],
      chunkIndexByAction: [0, 1, 5],
    });

    expect(deduped.actions.map((a) => a.titre)).toEqual([
      '1 ANCRER L’ADMINISTRATION DANS L’ECO-RESPONSABILITE',
      'Rénover les écoles',
    ]);
    expect(deduped.actions[0]).toMatchObject({
      axe: 'Axe I',
      description: 'Renforcer et rendre visible l’action de la métropole.',
    });
    expect(deduped.chunkIndexByAction).toEqual([5, 1]);
  });

  it('garde distinctes deux actions de même titre riches dans deux axes différents', () => {
    const deduped = dedupeByTitle({
      actions: [
        anAction('Sensibiliser le grand public', {
          axe: 'Axe 2 : Habitat',
          description: 'Ateliers rénovation énergétique.',
        }),
        anAction('Sensibiliser le grand public', {
          axe: 'Axe 5 : Mobilité',
          description: 'Campagne vélo au quotidien.',
        }),
      ],
      chunkIndexByAction: [0, 3],
    });

    expect(deduped.actions).toHaveLength(2);
    expect(deduped.actions.map((a) => a.axe)).toEqual([
      'Axe 2 : Habitat',
      'Axe 5 : Mobilité',
    ]);
  });

  it("fond l'écho sans contenu d'un titre même venu d'un autre axe", () => {
    const deduped = dedupeByTitle({
      actions: [
        anAction('Sensibiliser le grand public', {
          axe: 'Axe 2 : Habitat',
          description: 'Ateliers rénovation énergétique.',
        }),
        anAction('Sensibiliser le grand public', { axe: 'Sommaire' }),
      ],
      chunkIndexByAction: [0, 3],
    });

    expect(deduped.actions).toHaveLength(1);
    expect(deduped.actions[0]).toMatchObject({
      axe: 'Axe 2 : Habitat',
      description: 'Ateliers rénovation énergétique.',
    });
  });

  it('garde distinctes deux actions voisines', () => {
    const deduped = dedupeByTitle({
      actions: [
        anAction('Éco-rénover l’habitat social'),
        anAction('Éco-rénover l’habitat privé'),
      ],
      chunkIndexByAction: [0, 0],
    });

    expect(deduped.actions).toHaveLength(2);
  });
});
