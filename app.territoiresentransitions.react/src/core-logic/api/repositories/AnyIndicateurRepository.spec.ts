import '@testing-library/jest-dom/extend-expect';
import {supabaseClient} from 'core-logic/api/supabase';
import {AnyIndicateurValueWrite} from 'generated/dataLayer/any_indicateur_value_write';
import {yoloCredentials} from 'test_utils/collectivites';
import {
  indicateurPersonnaliseResultatRepository,
  indicateurResultatRepository,
} from './AnyIndicateurRepository';

describe('Indicateur resultat repo should retrieve data-layer default values', () => {
  it('Retrieves values for all years for a given collectivite ', async () => {
    const results =
      await indicateurResultatRepository.fetchIndicateurValuesForId({
        collectiviteId: 1,
        indicateurId: 'cae_8',
      });
    expect(results).toHaveLength(2);
  });
  it('Retrieves values for a given year for a given collectivite ', async () => {
    const results =
      await indicateurResultatRepository.fetchIndicateurValueForIdForYear({
        collectiviteId: 1,
        indicateurId: 'cae_8',
        year: 2020,
      });
    expect(results).not.toBeNull();
  });
});

describe('Any indicateur repositories can save values', () => {
  beforeAll(async () => {
    await supabaseClient.auth.signIn(yoloCredentials);
  });
  it('Saves indicateur referentiel resultat value and retrieve it ', async () => {
    const valueToSave: AnyIndicateurValueWrite<string> = {
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
      await indicateurResultatRepository.fetchIndicateurValueForIdForYear({
        indicateurId: 'cae_18',
        year: 2020,
        collectiviteId: 2,
      });
    expect(retrieved).not.toBeNull();
  });

  it('Saves indicateur personnalise resultat value and retrieve it ', async () => {
    const valueToSave: AnyIndicateurValueWrite<number> = {
      annee: 2020,
      valeur: 77,
      collectivite_id: 2,
      indicateur_id: 0,
    };
    // Save
    const saved = await indicateurPersonnaliseResultatRepository.save(
      valueToSave
    );
    expect(saved).not.toBeNull();

    // Retrieve
    const retrieved =
      await indicateurPersonnaliseResultatRepository.fetchIndicateurValueForIdForYear(
        {
          indicateurId: 0,
          year: 2020,
          collectiviteId: 2,
        }
      );
    expect(retrieved).not.toBeNull();
  });
});
