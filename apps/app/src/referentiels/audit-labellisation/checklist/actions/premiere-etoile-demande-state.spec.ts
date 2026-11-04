import {
  ParcoursLabellisation,
  ParcoursLabellisationStatus,
  SujetDemande,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { getPremiereEtoileDemandeState } from './premiere-etoile-demande-state';

type ParcoursForButtonState = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'labellisation'
>;

const buildParcours = ({
  status,
  sujet,
  etoiles,
}: {
  status: ParcoursLabellisationStatus;
  sujet?: SujetDemande;
  etoiles?: string;
}): ParcoursForButtonState => ({
  status,
  demande: sujet
    ? ({
        enCours: false,
        envoyeeLe: '2026-01-01T00:00:00.000Z',
        sujet,
        etoiles: etoiles ?? null,
      } as ParcoursForButtonState['demande'])
    : null,
  labellisation: null,
});

describe('getPremiereEtoileDemandeState', () => {
  it('request-pending quand la demande envoyée est une 1ère étoile', () => {
    expect(
      getPremiereEtoileDemandeState({
        canAskFirstStar: false,
        parcours: buildParcours({
          status: 'demande_envoyee',
          sujet: 'labellisation',
          etoiles: '1',
        }),
      })
    ).toEqual({ kind: 'request-pending' });
  });

  it('other-cycle-in-progress avec AUDIT_REQUEST_PENDING quand une demande COT est envoyée', () => {
    expect(
      getPremiereEtoileDemandeState({
        canAskFirstStar: false,
        parcours: buildParcours({ status: 'demande_envoyee', sujet: 'cot' }),
      })
    ).toEqual({
      kind: 'other-cycle-in-progress',
      reason: 'AUDIT_REQUEST_PENDING',
    });
  });

  it('other-cycle-in-progress avec AUDIT_IN_PROGRESS quand un audit est en cours', () => {
    expect(
      getPremiereEtoileDemandeState({
        canAskFirstStar: false,
        parcours: buildParcours({ status: 'audit_en_cours', sujet: 'cot' }),
      })
    ).toEqual({ kind: 'other-cycle-in-progress', reason: 'AUDIT_IN_PROGRESS' });
  });

  it('other-cycle-in-progress avec LABELLISATION_IN_PROGRESS quand un audit est validé sans labellisation obtenue', () => {
    expect(
      getPremiereEtoileDemandeState({
        canAskFirstStar: false,
        parcours: buildParcours({
          status: 'audit_valide',
          sujet: 'labellisation',
          etoiles: '2',
        }),
      })
    ).toEqual({
      kind: 'other-cycle-in-progress',
      reason: 'LABELLISATION_IN_PROGRESS',
    });
  });

  it('requestable quand aucun cycle est en cours et les critères sont remplis', () => {
    expect(
      getPremiereEtoileDemandeState({
        canAskFirstStar: true,
        parcours: buildParcours({ status: 'non_demandee' }),
      })
    ).toEqual({ kind: 'requestable' });
  });

  it('criteria-incomplete quand aucun cycle est en cours et les critères manquent', () => {
    expect(
      getPremiereEtoileDemandeState({
        canAskFirstStar: false,
        parcours: buildParcours({ status: 'non_demandee' }),
      })
    ).toEqual({ kind: 'criteria-incomplete' });
  });
});
