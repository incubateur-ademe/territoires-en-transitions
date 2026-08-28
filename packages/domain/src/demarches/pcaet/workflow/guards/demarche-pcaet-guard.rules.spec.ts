import { describe, expect, it } from 'vitest';
import {
  computeAvisDeadline,
  isDemarchePcaetAvisTousRendus,
  isDemarchePcaetPilote,
} from './demarche-pcaet-guard.rules';

/** Ce qu'on attend d'une DREAL : les deux titres de l'État. */
const TITRES_DREAL = [
  'prefet_region' as const,
  'autorite_environnementale' as const,
];

/** Ce qu'on attend d'un conseil régional : celui de son président. */
const TITRES_REGION = ['president_region' as const];

describe('règles pures des guards', () => {
  it('isDemarchePcaetPilote : pilote à compte, ou fallback sans pilote utilisateur', () => {
    expect(isDemarchePcaetPilote('u1', [{ userId: 'u1' }])).toBe(true);
    expect(isDemarchePcaetPilote('u2', [{ userId: 'u1' }])).toBe(false);
    // Pilotes uniquement en tags (sans compte) → tout éditeur est autorisé.
    expect(isDemarchePcaetPilote('u2', [{ userId: null }])).toBe(true);
    expect(isDemarchePcaetPilote('u2', [])).toBe(true);
  });

  describe('isDemarchePcaetAvisTousRendus', () => {
    it('faux sans aucune demande : la condition serait vraie à vide', () => {
      expect(isDemarchePcaetAvisTousRendus([])).toBe(false);
    });

    it('faux tant qu’un titre attendu manque', () => {
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: TITRES_DREAL, titresValides: ['prefet_region'] },
        ])
      ).toBe(false);
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: TITRES_DREAL, titresValides: [] },
        ])
      ).toBe(false);
    });

    it('vrai quand chaque demande a tous ses titres', () => {
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: TITRES_DREAL, titresValides: TITRES_DREAL },
        ])
      ).toBe(true);
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: TITRES_DREAL, titresValides: TITRES_DREAL },
          { titresAttendus: TITRES_REGION, titresValides: TITRES_REGION },
        ])
      ).toBe(true);
    });

    it('faux si une seule demande sur plusieurs est incomplète', () => {
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: TITRES_DREAL, titresValides: TITRES_DREAL },
          { titresAttendus: TITRES_REGION, titresValides: [] },
        ])
      ).toBe(false);
    });

    /**
     * Chaque destinataire ne répond que de ses titres : exiger les trois de la
     * DREAL ne serait jamais satisfait, puisque celui du président de région
     * revient au conseil régional.
     */
    it('n’attend d’une demande que les titres de son destinataire', () => {
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: TITRES_DREAL, titresValides: TITRES_DREAL },
        ])
      ).toBe(true);
    });

    /**
     * Une DDT reçoit le dossier en lecture : sa demande n'a aucun titre
     * attendu. La compter empêcherait toute clôture ; en revanche un dossier
     * qui n'aurait *que* des lecteurs n'est pas instruit pour autant.
     */
    it('écarte les destinataires en lecture seule', () => {
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: TITRES_DREAL, titresValides: TITRES_DREAL },
          { titresAttendus: [], titresValides: [] },
        ])
      ).toBe(true);
      expect(
        isDemarchePcaetAvisTousRendus([
          { titresAttendus: [], titresValides: [] },
        ])
      ).toBe(false);
    });
  });

  it('computeAvisDeadline : délai légal appliqué à la date de transmission', () => {
    expect(
      computeAvisDeadline(new Date('2026-08-06T10:00:00.000Z')).toISOString()
    ).toBe('2026-11-06T10:00:00.000Z');
    // Fin de mois : le débordement est reporté (31 août + 3 mois → 1er déc.).
    expect(
      computeAvisDeadline(new Date('2026-08-31T10:00:00.000Z')).toISOString()
    ).toBe('2026-12-01T10:00:00.000Z');
  });
});
