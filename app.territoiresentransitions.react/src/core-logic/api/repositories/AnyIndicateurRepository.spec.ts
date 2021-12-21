import '@testing-library/jest-dom/extend-expect';
import {supabase} from 'core-logic/api/supabase';
import {AnyIndicateurValueWrite} from 'generated/dataLayer/any_indicateur_value_write';
import {yiliCredentials, yoloCredentials} from 'test_utils/collectivites';
import {indicateurResultatRepository} from './AnyIndicateurRepository';

describe('Indicateur resultat repo should retrieve data-layer default values', () => {
  it('Retrieves values for all years for a given collectivite ', async () => {
    const results = await indicateurResultatRepository.fetchIndicateurForId({
      collectiviteId: 1,
      indicateurId: 'cae_8',
    });
    expect(results).toHaveLength(2);
  });
  it('Retrieves values for a given year for a given collectivite ', async () => {
    const results =
      await indicateurResultatRepository.fetchIndicateurForIdForYear({
        collectiviteId: 1,
        indicateurId: 'cae_8',
        year: 2020,
      });
    expect(results).not.toBeNull();
  });
});

describe('Indicateur resultat repo can save values', () => {
  beforeAll(async () => {
    await supabase.auth.signIn(yoloCredentials);
  });
  it('Saves values and retrieve them ', async () => {
    const valueToSave: AnyIndicateurValueWrite = {
      annee: 2020,
      valeur: 88,
      collectivite_id: 2,
      indicateur_id: 'cae_18',
    };
    // Save
    const saved = await indicateurResultatRepository.save(valueToSave);
    expect(saved).not.toBeNull();

    // Retrieve
    const retrieved =
      await indicateurResultatRepository.fetchIndicateurForIdForYear({
        indicateurId: 'cae_18',
        year: 2020,
        collectiviteId: 2,
      });
    expect(retrieved).not.toBeNull();
  });
});
