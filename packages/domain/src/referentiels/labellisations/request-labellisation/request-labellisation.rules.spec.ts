import { Etoile } from '../labellisation-etoile.enum.schema';
import {
  ParcoursLabellisationForRequest,
  canRequestAuditOrLabellisation,
  getParcoursLabellisationStatus,
} from './request-labellisation.rules';

type DemandeEtOuAudit = NonNullable<
  Parameters<typeof getParcoursLabellisationStatus>[0]
>;

const baseParcours: ParcoursLabellisationForRequest = {
  status: 'non_demandee',
  completude_ok: true,
  critere_score: {
    atteint: true,
    score_a_realiser: 0.5,
    score_fait: 0.6,
  } as ParcoursLabellisationForRequest['critere_score'],
  isCot: false,
  etoiles: 1 as Etoile,
  conditionFichiers: { atteint: true },
  criteres_action: [{ atteint: true }],
};

describe('canRequestAuditOrLabellisation — plafond d\'étoile dérivé du score réalisé', () => {
  it('autorise une étoile au-delà des étoiles obtenues quand le score réalisé le permet', () => {
    expect(
      canRequestAuditOrLabellisation(baseParcours, 'labellisation', 2)
    ).toEqual({ canRequest: true, reason: null });
  });

  it('se base sur le score réalisé et non sur le flag critere_score.atteint', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          critere_score: { ...baseParcours.critere_score, atteint: false },
        },
        'labellisation',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it('refuse une étoile au-delà du plafond autorisé par le score réalisé', () => {
    expect(
      canRequestAuditOrLabellisation(
        {
          ...baseParcours,
          critere_score: { ...baseParcours.critere_score, score_fait: 0.35 },
        },
        'labellisation',
        3
      )
    ).toEqual({
      canRequest: false,
      reason: 'SCORE_GLOBAL_CRITERIA_NOT_SATISFIED',
    });
  });
});

describe('getParcoursLabellisationStatus — état consolidé du cycle', () => {
  const auditEnCours: DemandeEtOuAudit['audit'] = {
    valide: false,
    date_debut: '2026-01-01T00:00:00.000Z',
    date_fin: null,
  };

  it('retourne non_demandee quand il n\'y a ni demande ni audit', () => {
    expect(getParcoursLabellisationStatus(null)).toBe('non_demandee');
    expect(getParcoursLabellisationStatus(undefined)).toBe('non_demandee');
    expect(
      getParcoursLabellisationStatus({ demande: null, audit: null })
    ).toBe('non_demandee');
  });

  it('retourne demande_envoyee quand la demande est envoyee (en_cours = false) sans audit demarre', () => {
    expect(
      getParcoursLabellisationStatus({
        demande: { en_cours: false },
        audit: null,
      })
    ).toBe('demande_envoyee');
  });

  it('retourne non_demandee tant que la demande est en cours d\'edition (en_cours = true)', () => {
    expect(
      getParcoursLabellisationStatus({
        demande: { en_cours: true },
        audit: null,
      })
    ).toBe('non_demandee');
  });

  it('retourne audit_en_cours quand l\'audit a une date de debut et n\'est pas valide', () => {
    expect(
      getParcoursLabellisationStatus({ demande: null, audit: auditEnCours })
    ).toBe('audit_en_cours');
  });

  it('retourne audit_valide quand l\'audit est valide', () => {
    expect(
      getParcoursLabellisationStatus({
        demande: null,
        audit: { valide: true, date_debut: null, date_fin: null },
      })
    ).toBe('audit_valide');
  });

  it('priorise audit_valide sur audit_en_cours quand l\'audit demarre est aussi valide', () => {
    expect(
      getParcoursLabellisationStatus({
        demande: null,
        audit: { ...auditEnCours, valide: true },
      })
    ).toBe('audit_valide');
  });

  it('priorise audit_en_cours sur demande_envoyee quand l\'audit est demarre', () => {
    expect(
      getParcoursLabellisationStatus({
        demande: { en_cours: false },
        audit: auditEnCours,
      })
    ).toBe('audit_en_cours');
  });
});
