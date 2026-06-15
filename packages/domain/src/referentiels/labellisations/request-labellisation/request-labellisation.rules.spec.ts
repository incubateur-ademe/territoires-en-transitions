import { Etoile } from '../labellisation-etoile.enum.schema';
import {
  ParcoursLabellisationForRequest,
  canRequestAuditOrLabellisation,
} from './request-labellisation.rules';

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
