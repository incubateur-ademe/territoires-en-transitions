import { describe, expect, it } from 'vitest';
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';

describe('cron-action-management', () => {
  it.skip('change quand le titre change', () => {
    const before = calculateFicheFingerprint({
      titre: 'Pistes cyclables',
      description: 'Dix km',
    });
    const after = calculateFicheFingerprint({
      titre: 'Pistes cyclables sécurisées',
      description: 'Dix km',
    });

    expect(after).not.toEqual(before);
  });

  it.skip('change quand la description change', () => {
    const before = calculateFicheFingerprint({
      titre: 'Pistes cyclables',
      description: 'Dix km',
    });
    const after = calculateFicheFingerprint({
      titre: 'Pistes cyclables',
      description: 'Vingt km',
    });

    expect(after).not.toEqual(before);
  });

  it.skip('change quand seul un espace est ajouté, car elle porte sur le texte brut', () => {
    const before = calculateFicheFingerprint({
      titre: 'Pistes cyclables',
      description: 'Dix km',
    });
    const after = calculateFicheFingerprint({
      titre: 'Pistes cyclables ',
      description: 'Dix km',
    });

    expect(after).not.toEqual(before);
  });
});

describe('invariants', () => {
  it.skip('est identique pour un même titre et une même description', () => {
    const first = calculateFicheFingerprint({
      titre: 'Pistes cyclables',
      description: 'Dix km',
    });
    const second = calculateFicheFingerprint({
      titre: 'Pistes cyclables',
      description: 'Dix km',
    });

    expect(second).toEqual(first);
  });

  it.skip('est identique pour une description absente et une description vide', () => {
    const withNullDescription = calculateFicheFingerprint({
      titre: 'Bulletin municipal',
      description: null,
    });
    const withEmptyDescription = calculateFicheFingerprint({
      titre: 'Bulletin municipal',
      description: '',
    });

    expect(withEmptyDescription).toEqual(withNullDescription);
  });

  it.skip('change quand du texte passe du titre à la description', () => {
    const before = calculateFicheFingerprint({
      titre: 'ab',
      description: 'c',
    });
    const after = calculateFicheFingerprint({
      titre: 'a',
      description: 'bc',
    });

    expect(after).not.toEqual(before);
  });

  it.skip('est un sha256 en hexadécimal minuscule', () => {
    const fingerprint = calculateFicheFingerprint({
      titre: 'Pistes cyclables',
      description: 'Dix km',
    });

    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });
});
