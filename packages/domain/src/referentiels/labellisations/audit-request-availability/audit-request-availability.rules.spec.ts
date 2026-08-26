import { describe, expect, it } from 'vitest';
import { Etoile } from '../labellisation-etoile.enum.schema';
import { ObjetPreuveEnum } from '../objet-preuve.enum.schema';
import { listAuditTypeOptions } from '../audit-type-options/audit-type-options.rules';
import {
  AuditRequestAvailability,
  getAuditRequestAvailability,
  ParcoursForAuditRequest,
} from './audit-request-availability.rules';

const makeParcours = (
  overrides: Partial<ParcoursForAuditRequest> = {}
): ParcoursForAuditRequest => ({
  status: 'non_demandee',
  demande: null,
  labellisation: null,
  referentiel: 'cae',
  referentRolesDefined: { eluReferent: true, referentTechnique: true },
  completude_ok: true,
  critere_score: {
    atteint: true,
    score_a_realiser: 0.35,
    score_fait: 0.4,
  } as ParcoursForAuditRequest['critere_score'],
  isCot: false,
  etoiles: 2 as Etoile,
  conditionFichiers: { preuve_nombre: 1 },
  preuvesObjets: [
    { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT },
    { objet: ObjetPreuveEnum.CANDIDATURE },
  ],
  criteres_action: [{ atteint: true, action_id: 'cae_1.1.1' }],
  ...overrides,
});

const availabilityOf = (
  parcours: ParcoursForAuditRequest,
  context: {
    isCOT: boolean;
    maximumRequestableStar: Etoile;
  }
): AuditRequestAvailability =>
  getAuditRequestAvailability(parcours, listAuditTypeOptions(parcours, context));

describe('getAuditRequestAvailability', () => {
  it("non-COT + maximumRequestableStar < 2 : indisponible, aucun type d'audit demandable", () => {
    expect(
      availabilityOf(makeParcours({ etoiles: 1 as Etoile }), {
        isCOT: false,
        maximumRequestableStar: 1,
      })
    ).toEqual({
      canRequest: false,
      reason: { kind: 'noRequestableAuditType' },
    });
  });

  it("COT + maximumRequestableStar = 1 : indisponible, aucun type d'audit demandable avant la 2e étoile", () => {
    expect(
      availabilityOf(makeParcours({ isCot: true, etoiles: 1 as Etoile }), {
        isCOT: true,
        maximumRequestableStar: 1,
      })
    ).toEqual({
      canRequest: false,
      reason: { kind: 'noRequestableAuditType' },
    });
  });

  it('non-COT + maximumRequestableStar = 2 : disponible (audit de labellisation demandable)', () => {
    expect(
      availabilityOf(makeParcours(), {
        isCOT: false,
        maximumRequestableStar: 2,
      })
    ).toEqual({ canRequest: true, reason: null });
  });

  it('non-COT + étoile 2 mais référentiel incomplet : indisponible (prérequis incomplets)', () => {
    expect(
      availabilityOf(makeParcours({ completude_ok: false }), {
        isCOT: false,
        maximumRequestableStar: 2,
      })
    ).toEqual({
      canRequest: false,
      reason: { kind: 'prerequisitesIncomplete' },
    });
  });

  it("non-COT + étoile 2 avec un critère d'action non atteint : indisponible (prérequis incomplets)", () => {
    expect(
      availabilityOf(
        makeParcours({
          criteres_action: [
            { atteint: true, action_id: 'cae_1.1.1' },
            { atteint: false, action_id: 'cae_1.1.2' },
          ],
        }),
        { isCOT: false, maximumRequestableStar: 2 }
      )
    ).toEqual({
      canRequest: false,
      reason: { kind: 'prerequisitesIncomplete' },
    });
  });

  it('non-COT + étoile 2 sans fichier de candidature : indisponible (prérequis incomplets)', () => {
    expect(
      availabilityOf(
        makeParcours({
          conditionFichiers: { preuve_nombre: 0 },
          preuvesObjets: [],
        }),
        { isCOT: false, maximumRequestableStar: 2 }
      )
    ).toEqual({
      canRequest: false,
      reason: { kind: 'prerequisitesIncomplete' },
    });
  });

  it('cycle déjà demandé : indisponible avec cycleUnavailable et la raison du cycle', () => {
    expect(
      availabilityOf(
        makeParcours({
          status: 'demande_envoyee',
          demande: {
            envoyee_le: '2026-01-01T00:00:00.000Z',
          } as ParcoursForAuditRequest['demande'],
        }),
        { isCOT: true, maximumRequestableStar: 2 }
      )
    ).toEqual({
      canRequest: false,
      reason: { kind: 'cycleUnavailable', cause: 'AUDIT_REQUEST_PENDING' },
    });
  });

  it('cycle clos après labellisation obtenue + type demandable : disponible (cycle suivant)', () => {
    expect(
      availabilityOf(
        makeParcours({
          status: 'audit_valide',
          etoiles: 3 as Etoile,
          critere_score: {
            atteint: true,
            score_a_realiser: 0.65,
            score_fait: 0.7,
          } as ParcoursForAuditRequest['critere_score'],
          demande: {
            envoyee_le: '2026-01-01T00:00:00.000Z',
          } as ParcoursForAuditRequest['demande'],
          labellisation: {
            obtenue_le: '2026-06-01T00:00:00.000Z',
          } as ParcoursForAuditRequest['labellisation'],
        }),
        { isCOT: false, maximumRequestableStar: 3 }
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('cycle clos après audit COT terminé : disponible (la CT peut redemander)', () => {
    expect(
      availabilityOf(
        makeParcours({
          status: 'audit_valide',
          isCot: true,
          demande: {
            sujet: 'cot',
            envoyee_le: '2026-01-01T00:00:00.000Z',
          } as ParcoursForAuditRequest['demande'],
        }),
        { isCOT: true, maximumRequestableStar: 2 }
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('indisponible quand les référents ne sont pas désignés, même avec tous les critères atteints', () => {
    expect(
      availabilityOf(
        makeParcours({
          criteres_action: [{ atteint: true, action_id: 'cae_5.1.2.1.1' }],
          referentRolesDefined: {
            eluReferent: false,
            referentTechnique: true,
          },
        }),
        { isCOT: false, maximumRequestableStar: 2 }
      )
    ).toEqual({
      canRequest: false,
      reason: { kind: 'prerequisitesIncomplete' },
    });
  });

  it("cycleUnavailable prime sur l'absence de type (l'utilisateur doit d'abord finir le cycle en cours)", () => {
    expect(
      availabilityOf(
        makeParcours({
          status: 'audit_en_cours',
          etoiles: 1 as Etoile,
          demande: {
            envoyee_le: '2026-01-01T00:00:00.000Z',
          } as ParcoursForAuditRequest['demande'],
        }),
        { isCOT: false, maximumRequestableStar: 1 }
      )
    ).toEqual({
      canRequest: false,
      reason: { kind: 'cycleUnavailable', cause: 'AUDIT_IN_PROGRESS' },
    });
  });
});
