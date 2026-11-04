import { describe, expect, it } from 'vitest';
import { toReponseAttendue } from './reponse-attendue.rule';

describe('toReponseAttendue', () => {
  it.each([
    { referentiel: 'cae', actionId: 'cae_5.1.2.1.1' },
    { referentiel: 'cae', actionId: 'cae_5.1.1.1.3' },
    { referentiel: 'eci', actionId: 'eci_1.1.1.1' },
    { referentiel: 'eci', actionId: 'eci_1.1.1.3' },
  ] as const)(
    'attend une personne renseignée pour la mesure de référent $actionId, bien que ses seuils exigent le statut Fait',
    ({ referentiel, actionId }) => {
      expect(
        toReponseAttendue({
          referentiel,
          actionId,
          minRealisePercentage: 100,
          minProgrammePercentage: null,
        })
      ).toEqual({ kind: 'personne-renseignee' });
    }
  );

  it("n'attend pas de personne renseignée pour une mesure de même identifiant dans un référentiel sans audit", () => {
    expect(
      toReponseAttendue({
        referentiel: 'te',
        actionId: 'te_5.1.2.1.1',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toEqual({ kind: 'statut-fait' });
  });

  it('exige le statut Fait pour la conformité PCAET à la deuxième étoile, où le statut Programmé ne suffit plus', () => {
    expect(
      toReponseAttendue({
        referentiel: 'cae',
        actionId: 'cae_1.1.2.0.1',
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      })
    ).toEqual({ kind: 'statut-fait' });
  });

  it('accepte Fait ou Programmé pour la conformité PCAET à la première étoile', () => {
    expect(
      toReponseAttendue({
        referentiel: 'cae',
        actionId: 'cae_1.1.2.0.1',
        minRealisePercentage: 100,
        minProgrammePercentage: 100,
      })
    ).toEqual({ kind: 'statut-fait-ou-programme' });
  });

  it('exige 20 % fait minimum pour le diagnostic territorial', () => {
    expect(
      toReponseAttendue({
        referentiel: 'cae',
        actionId: 'cae_1.1.2',
        minRealisePercentage: 20,
        minProgrammePercentage: null,
      })
    ).toEqual({ kind: 'pourcentage-fait-minimum', fait: 20 });
  });

  it('garde les deux seuils quand 50 % fait ou 75 % programmé suffisent', () => {
    expect(
      toReponseAttendue({
        referentiel: 'cae',
        actionId: 'cae_1.1.2',
        minRealisePercentage: 50,
        minProgrammePercentage: 75,
      })
    ).toEqual({
      kind: 'pourcentage-fait-ou-programme-minimum',
      fait: 50,
      programme: 75,
    });
  });

  it("garde le seuil de 80 % fait au lieu de l'arrondir à Fait ou Programmé quand 100 % programmé suffit aussi", () => {
    expect(
      toReponseAttendue({
        referentiel: 'cae',
        actionId: 'cae_1.1.2',
        minRealisePercentage: 80,
        minProgrammePercentage: 100,
      })
    ).toEqual({
      kind: 'pourcentage-fait-ou-programme-minimum',
      fait: 80,
      programme: 100,
    });
  });
});
