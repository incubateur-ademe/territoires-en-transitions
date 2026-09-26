import { describe, expect, it } from 'vitest';
import { toFaultyFicheIds } from './to-faulty-fiche-ids.rules';

describe('retry-on-failure', () => {
  const batch = [
    { ficheId: 11, titre: 'Pistes cyclables', description: 'Dix km' },
    { ficheId: 12, titre: 'Bulletin municipal', description: null },
    { ficheId: 13, titre: 'Rénovation des écoles', description: null },
  ];

  it.skip('désigne tout le lot quand la limite de débit du LLM est atteinte', () => {
    expect(
      toFaultyFicheIds({ failure: { kind: 'rate_limited' }, fiches: batch })
    ).toEqual([11, 12, 13]);
  });

  it.skip('désigne tout le lot pour une réponse tronquée', () => {
    expect(
      toFaultyFicheIds({ failure: { kind: 'truncated' }, fiches: batch })
    ).toEqual([11, 12, 13]);
  });

  it.skip('désigne tout le lot pour une réponse en JSON invalide', () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'invalid_json', rawTextLength: 12 },
        fiches: batch,
      })
    ).toEqual([11, 12, 13]);
  });

  it.skip("désigne tout le lot pour une erreur de l'API", () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'api_error', httpStatus: 503 },
        fiches: batch,
      })
    ).toEqual([11, 12, 13]);
  });

  it.skip('désigne tout le lot pour un lot vide', () => {
    expect(
      toFaultyFicheIds({ failure: { kind: 'empty_batch' }, fiches: batch })
    ).toEqual([11, 12, 13]);
  });

  it.skip('désigne tout le lot pour un lot trop grand', () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'batch_too_large', count: 60 },
        fiches: batch,
      })
    ).toEqual([11, 12, 13]);
  });

  it.skip('désigne tout le lot pour une réponse vide', () => {
    expect(
      toFaultyFicheIds({ failure: { kind: 'empty_response' }, fiches: batch })
    ).toEqual([11, 12, 13]);
  });

  it.skip('désigne tout le lot pour un index hors du lot', () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'unexpected_index', index: 7 },
        fiches: batch,
      })
    ).toEqual([11, 12, 13]);
  });

  it.skip('désigne tout le lot pour un enjeu inconnu', () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'unknown_enjeu', enjeu: 'biodiversite' },
        fiches: batch,
      })
    ).toEqual([11, 12, 13]);
  });

  it.skip("désigne la fiche de l'index en double", () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'duplicate_index', index: 1 },
        fiches: batch,
      })
    ).toEqual([12]);
  });

  it.skip("désigne la fiche d'une abstention contradictoire", () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'contradictory_abstention', index: 0 },
        fiches: batch,
      })
    ).toEqual([11]);
  });

  it.skip("désigne la fiche d'une abstention non déclarée", () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'undeclared_abstention', index: 2 },
        fiches: batch,
      })
    ).toEqual([13]);
  });

  it.skip('désigne les fiches des index manquants', () => {
    expect(
      toFaultyFicheIds({
        failure: { kind: 'missing_indexes', indexes: [0, 2] },
        fiches: batch,
      })
    ).toEqual([11, 13]);
  });
});
