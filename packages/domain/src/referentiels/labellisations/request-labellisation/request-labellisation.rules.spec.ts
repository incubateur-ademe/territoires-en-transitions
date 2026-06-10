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

describe('canRequestAuditOrLabellisation — un seul cycle à la fois', () => {
  it('autorise une demande de labellisation 1ère étoile quand aucun cycle est en cours', () => {
    expect(
      canRequestAuditOrLabellisation(
        withStatus('non_demandee'),
        'labellisation',
        1
      )
    ).toEqual({ canRequest: true, reason: null });
  });

  it.each<ParcoursLabellisationStatus>([
    'demande_envoyee',
    'audit_en_cours',
    'audit_valide',
  ])(
    'refuse une demande de labellisation 1ère étoile quand status=%s (le service écraserait la demande du cycle en cours)',
    (status) => {
      expect(
        canRequestAuditOrLabellisation(withStatus(status), 'labellisation', 1)
      ).toEqual({ canRequest: false, reason: 'AUDIT_ALREADY_REQUESTED' });
    }
  );

  it('refuse une demande labellisation_cot 1ère étoile quand un audit est en cours', () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...withStatus('audit_en_cours'), isCot: true },
        'labellisation_cot',
        1
      )
    ).toEqual({ canRequest: false, reason: 'AUDIT_ALREADY_REQUESTED' });
  });

  it('refuse une demande de labellisation 2ème étoile si un cycle est déjà en cours', () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...withStatus('demande_envoyee'), etoiles: 2 as Etoile },
        'labellisation',
        2
      )
    ).toEqual({ canRequest: false, reason: 'AUDIT_ALREADY_REQUESTED' });
  });

  it('refuse une demande COT seule si un cycle est déjà en cours', () => {
    expect(
      canRequestAuditOrLabellisation(
        { ...withStatus('demande_envoyee'), isCot: true },
        'cot',
        null
      )
    ).toEqual({ canRequest: false, reason: 'AUDIT_ALREADY_REQUESTED' });
  });
});
