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
    const insertResult = await endpoint.save(indicateurValue);

    expect(insertResult).not.toBeNull();
    expect(insertResult).toEqual(
      expect.objectContaining({
        annee: 2020,
        valeur: 12.4,
        indicateur_id: 'cae_10',
        collectivite_id: 1,
      })
    );

    // Save again (update)
    const updateResult = await endpoint.save({
      annee: 2020,
      valeur: 18,
      indicateur_id: 'cae_10',
      collectivite_id: 1,
    });
    expect(updateResult).not.toBeNull();
    expect(insertResult).toEqual(
      expect.objectContaining({
        valeur: 18,
      })
    );
  });
});
