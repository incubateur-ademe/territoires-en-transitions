import { describe, expect, it } from 'vitest';
import { getEcheanceAvis } from './echeance-avis';

const at = (iso: string) => new Date(iso).getTime();

const echeance = (nowIso: string, avisAttendu = true) =>
  getEcheanceAvis({
    transmittedAt: '2026-08-06T10:00:00.000Z',
    avisDeadlineAt: '2026-12-06T10:00:00.000Z',
    avisAttendu,
    nowMs: at(nowIso),
  });

describe('getEcheanceAvis', () => {
  it('place la date limite deux mois après la transmission', () => {
    expect(echeance('2026-08-07T00:00:00.000Z').date).toEqual(
      new Date('2026-10-06T10:00:00.000Z')
    );
  });

  it('est à venir au-delà de 21 jours', () => {
    expect(echeance('2026-09-14T10:00:00.000Z').phase).toBe('a_venir');
  });

  it('est proche à 21 jours ou moins', () => {
    const { phase, joursRestants } = echeance('2026-09-15T10:00:00.000Z');
    expect(phase).toBe('proche');
    expect(joursRestants).toBe(21);
  });

  it('est hors délai entre la date limite et la date butoir', () => {
    expect(echeance('2026-11-01T10:00:00.000Z').phase).toBe('hors_delai');
  });

  it('est close après la date butoir', () => {
    expect(echeance('2026-12-07T10:00:00.000Z').phase).toBe('close');
  });

  it('est close quand aucun avis n’est attendu', () => {
    expect(echeance('2026-09-15T10:00:00.000Z', false).phase).toBe('close');
  });
});
