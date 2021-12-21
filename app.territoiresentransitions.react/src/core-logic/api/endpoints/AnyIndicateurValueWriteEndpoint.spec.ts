import '@testing-library/jest-dom/extend-expect';
import {makeNewIndicateurResultatWriteEndpoint} from 'core-logic/api/endpoints/AnyIndicateurValueWriteEndpoint';
import {supabase} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';
import {AnyIndicateurValueWrite} from '../../../generated/dataLayer/any_indicateur_value_write';

describe('Indicateur-resultat write endpoint', () => {
  beforeAll(async () => {
    await supabase.auth.signIn(yiliCredentials);
  });
  it('Saving a resultat value for a given year should return an equivalent indicateur value', async () => {
    const endpoint = makeNewIndicateurResultatWriteEndpoint();
    const indicateurValue: AnyIndicateurValueWrite = {
      annee: 2020,
      valeur: 12.4,
      indicateur_id: 'cae_10',
      collectivite_id: 1,
    };
    const result = await endpoint.save(indicateurValue);

    expect(result).not.toBeNull();
    expect(result).toEqual(
      expect.objectContaining({
        annee: 2020,
        valeur: 12.4,
        indicateur_id: 'cae_10',
        collectivite_id: 1,
      })
    );
  });
});
