import '@testing-library/jest-dom/extend-expect';
import {makeNewIndicateurResultatReadEndpoint} from 'core-logic/api/endpoints/AnyIndicateurValueReadEndpoint';

describe('Indicateur-resultat reading endpoint should retrieve data-layer default resultat values', () => {
  const endpoint = makeNewIndicateurResultatReadEndpoint();

  it(
    'Retrieves at least one resutat when collectivite_id and indicateur_id with resultat' +
      ' are given',
    async () => {
      const results = await endpoint.getBy({
        collectiviteId: 1,
        indicateurId: 'cae_8',
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          indicateur_id: 'cae_8',
          collectivite_id: 1,
          annee: 2020,
          valeur: 20,
        })
      );
    }
  );
  it(
    'Retrieves no resultat values when collectivite_id without indicateur resultats is' +
      ' given',
    async () => {
      const results = await endpoint.getBy({
        collectiviteId: 2,
        indicateurId: 'cae_8',
      });
      expect(results.length).toEqual(0);
    }
  );
});
