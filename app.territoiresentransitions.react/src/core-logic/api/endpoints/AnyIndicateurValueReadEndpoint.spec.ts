import '@testing-library/jest-dom/extend-expect';
import {
  indicateurPersonnaliseObjectifReadEndpoint,
  indicateurPersonnaliseResultatReadEndpoint,
  indicateurResultatReadEndpoint,
} from 'core-logic/api/endpoints/AnyIndicateurValueReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Indicateur-resultat reading endpoint should retrieve data-layer default resultat values  (for anyone connected)', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signInWithPassword(yuluCredentials); // Yulu has no rights on collectivite #1
  });

  it('Retrieves at least one resutat when collectivite_id with resultat for collectivite #1', async () => {
    const results = await indicateurResultatReadEndpoint.getBy({
      collectiviteId: 1,
    });
    expect(indicateurResultatReadEndpoint.lastResponse?.status).toBe(200);
    expect(results[0]).toEqual(
      expect.objectContaining({
        indicateur_id: 'cae_8',
        collectivite_id: 1,
        annee: 2020,
        valeur: 20,
      })
    );
  });
});

describe('Indicateur-personnalise values reading endpoint should retrieve data-layer default resultat values (for anyone connected)', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signInWithPassword(yuluCredentials); // Yulu has no rights on collectivite #1.
  });
  it('Retrieves one resutat when collectivite_id with resultat for collectivite #1', async () => {
    const results = await indicateurPersonnaliseResultatReadEndpoint.getBy({
      collectiviteId: 1,
    });
    expect(results[0]).toEqual(
      expect.objectContaining({
        indicateur_id: 0,
        collectivite_id: 1,
        annee: 2021,
        valeur: 22.33,
      })
    );
  });
  it('Retrieves one objectif when collectivite_id with resultat for collectivite #1', async () => {
    const results = await indicateurPersonnaliseObjectifReadEndpoint.getBy({
      collectiviteId: 1,
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        indicateur_id: 0,
        collectivite_id: 1,
        annee: 2021,
        valeur: 23.33,
      })
    );
  });
});
