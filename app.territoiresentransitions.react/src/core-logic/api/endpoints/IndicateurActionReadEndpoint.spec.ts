import '@testing-library/jest-dom/extend-expect';
import {indicateurActionReadEndpoint} from 'core-logic/api/endpoints/IndicateurActionReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yoloCredentials} from 'test_utils/collectivites';

describe('Indicateur action reading endpoint', () => {
  // todo add indicateur-action fake content
  it('should retrieve data-layer all indicateur definitions', async () => {
    await supabaseClient.auth.signIn(yoloCredentials);
    const results = await indicateurActionReadEndpoint.getBy({});
    expect(results).toHaveLength(157);
  });
});
