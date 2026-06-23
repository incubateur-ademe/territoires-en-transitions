import {
  ParcoursLabellisation,
  ParcoursLabellisationStatus,
  SujetDemande,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { isPremiereEtoileDemandePending } from './premiere-etoile-demande-pending';

const buildParcours = ({
  status,
  sujet,
  etoiles,
}: {
  status: ParcoursLabellisationStatus;
  sujet?: SujetDemande | null;
  etoiles?: string | null;
}): Pick<ParcoursLabellisation, 'status' | 'demande'> => ({
  status,
  demande: sujet
    ? ({ sujet, etoiles: etoiles ?? null } as ParcoursLabellisation['demande'])
    : null,
});

describe('isPremiereEtoileDemandePending', () => {
  it('est vrai pour une demande labellisation 1ère étoile envoyée', () => {
    expect(
      isPremiereEtoileDemandePending(
        buildParcours({
          status: 'demande_envoyee',
          sujet: 'labellisation',
          etoiles: '1',
        })
      )
    ).toBe(true);
  });

  it('est vrai pour une demande labellisation_cot 1ère étoile envoyée', () => {
    expect(
      isPremiereEtoileDemandePending(
        buildParcours({
          status: 'demande_envoyee',
          sujet: 'labellisation_cot',
          etoiles: '1',
        })
      )
    ).toBe(true);
  });

  it("est faux quand l'audit COT seul est en cours (sujet cot, pas une 1ère étoile)", () => {
    expect(
      isPremiereEtoileDemandePending(
        buildParcours({
          status: 'demande_envoyee',
          sujet: 'cot',
          etoiles: null,
        })
      )
    ).toBe(false);
  });

  it('est faux pour une demande de labellisation 2e étoile envoyée', () => {
    expect(
      isPremiereEtoileDemandePending(
        buildParcours({
          status: 'demande_envoyee',
          sujet: 'labellisation',
          etoiles: '2',
        })
      )
    ).toBe(false);
  });

  it("est faux quand aucune demande n'a été envoyée", () => {
    expect(
      isPremiereEtoileDemandePending(buildParcours({ status: 'non_demandee' }))
    ).toBe(false);
  });

  it('est faux quand le parcours est absent', () => {
    expect(isPremiereEtoileDemandePending(null)).toBe(false);
  });
});
