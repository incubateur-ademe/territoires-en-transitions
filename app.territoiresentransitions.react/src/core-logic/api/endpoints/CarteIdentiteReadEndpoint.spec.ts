import '@testing-library/jest-dom/extend-expect';
import {carteIdentiteReadEndpoint} from 'core-logic/api/endpoints/CarteIdentititeReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';

describe('ClientScores reading endpoint ', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });

  it('should retrieve identite for collectivite #1 ', async () => {
    const results = await carteIdentiteReadEndpoint.getBy({
      collectivite_id: 1,
    });
    expect(carteIdentiteReadEndpoint.lastResponse?.status).toBe(200);
    expect(results[0]).toMatchObject({
      code_siren_insee: '01004',
      collectivite_id: 1,
      departement_name: 'Ain',
      nom: 'Ambérieu-en-Bugey',
      population_source: 'Insee 12/01/2022',
      population_totale: 14514,
      region_name: 'Auvergne-Rhône-Alpes',
      type_collectivite: 'commune',
    });
  });
});
