import { describe, expect, it } from 'vitest';
import {
  getDateCivileFrance,
  isDateAdoptionPcaetRecevable,
} from './pcaet-date-adoption.rules';

describe('date d’adoption recevable', () => {
  const AUJOURDHUI = '2026-09-18';

  it('accepte une délibération passée', () => {
    expect(isDateAdoptionPcaetRecevable('2025-01-15', AUJOURDHUI)).toBe(true);
  });

  // Le dépôt suit souvent le conseil de plusieurs semaines : antidater est le
  // cas normal, pas une tolérance.
  it('accepte la date du jour', () => {
    expect(isDateAdoptionPcaetRecevable(AUJOURDHUI, AUJOURDHUI)).toBe(true);
  });

  it('refuse une délibération à venir', () => {
    expect(isDateAdoptionPcaetRecevable('2026-09-19', AUJOURDHUI)).toBe(false);
    expect(isDateAdoptionPcaetRecevable('2099-01-01', AUJOURDHUI)).toBe(false);
  });
});

describe('date civile de référence', () => {
  // Le piège que le fuseau du serveur tend : passé 22 h UTC, Paris est déjà au
  // lendemain. Comparer en UTC refuserait la date du jour à Paris.
  it('suit le calendrier de Paris, pas celui du serveur', () => {
    expect(getDateCivileFrance(new Date('2026-09-18T22:30:00Z'))).toBe(
      '2026-09-19'
    );
    expect(getDateCivileFrance(new Date('2026-09-18T10:00:00Z'))).toBe(
      '2026-09-18'
    );
    // Heure d'hiver : l'écart n'est plus que d'une heure.
    expect(getDateCivileFrance(new Date('2026-01-18T23:30:00Z'))).toBe(
      '2026-01-19'
    );
  });
});
