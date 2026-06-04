import { Etoile } from '../labellisation-etoile.enum.schema';
import { ParcoursLabellisationStatus } from '../parcours-labellisation-status.enum';
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

const withStatus = (
  status: ParcoursLabellisationStatus
): ParcoursLabellisationForRequest => ({ ...baseParcours, status });

describe('canRequestAuditOrLabellisation — 1ère étoile indépendante du cycle audit', () => {
  it.each<ParcoursLabellisationStatus>([
    'demande_envoyee',
    'audit_en_cours',
    'audit_valide',
  ])(
    'autorise une demande de labellisation 1ère étoile même quand status=%s (régression)',
    (status) => {
      expect(
        canRequestAuditOrLabellisation(withStatus(status), 'labellisation', 1)
      ).toEqual({ canRequest: true, reason: null });
    }
  );

  it('autorise une demande labellisation_cot 1ère étoile même quand un audit est en cours', () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...withStatus('audit_en_cours'), isCot: true },
        'labellisation_cot',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it("refuse une demande de labellisation 2ème étoile si un cycle est déjà en cours (comportement existant préservé)", () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...withStatus('demande_envoyee'), etoiles: 2 as Etoile },
        'labellisation',
        2
      )
    ).toEqual({ canRequest: false, reason: 'AUDIT_ALREADY_REQUESTED' });
  });

  it('refuse une demande COT seule si un cycle est déjà en cours (comportement existant préservé)', () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...withStatus('demande_envoyee'), isCot: true },
        'cot',
        null
      )
    ).toEqual({ canRequest: false, reason: 'AUDIT_ALREADY_REQUESTED' });
  });
});
