import '@testing-library/jest-dom/extend-expect';
import {
  makeNewIndicateurPersonnaliseResultatWriteEndpoint,
  makeNewIndicateurResultatWriteEndpoint,
} from 'core-logic/api/endpoints/AnyIndicateurValueWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials, yuluCredentials} from 'test_utils/collectivites';
import {AnyIndicateurValueWrite} from '../../../generated/dataLayer/any_indicateur_value_write';

// NB : We're testing the behavior for resultat endpoints only (referentiel & perso), since the objectif is very similar (but we could do both to ensure there's no mistake on table name)
describe('Indicateur-resultat write endpoint', () => {
  beforeAll(async () => {
    await supabaseClient.auth.signInWithPassword(yiliCredentials);
  });
  it('Should be able to save an update an indicateur resultat for an editable collectivite', async () => {
    const endpoint = makeNewIndicateurResultatWriteEndpoint();
    const indicateurValue: AnyIndicateurValueWrite<string> = {
      annee: 2020,
      valeur: 20.4,
      indicateur_id: 'cae_10',
      collectivite_id: 2,
    };
    const insertResult = await endpoint.save(indicateurValue);

    expect(insertResult).not.toBeNull();
    expect(insertResult).toEqual(
      expect.objectContaining({
        annee: 2020,
        valeur: 20.4,
        indicateur_id: 'cae_10',
        collectivite_id: 2,
      })
    );

    // Update
    const updateResult = await endpoint.save({
      annee: 2020,
      valeur: 18,
      indicateur_id: 'cae_10',
      collectivite_id: 2,
    });
    expect(updateResult).not.toBeNull();
    expect(updateResult).toEqual(
      expect.objectContaining({
        valeur: 18,
      })
    );
  });

  it('Saving an indicateur resultat value for a collectivite readonly should fail', async () => {
    const endpoint = makeNewIndicateurResultatWriteEndpoint();
    const indicateurValue: AnyIndicateurValueWrite<string> = {
      annee: 2020,
      valeur: 12.4,
      indicateur_id: 'cae_10',
      collectivite_id: 8, // Yili has no right on collectivite #8
    };
    const insertResult = await endpoint.save(indicateurValue);

    expect(insertResult).toBeNull();
  });
});

describe('Indicateur personnalise resultat write endpoint', () => {
  beforeAll(async () => {
    await supabaseClient.auth.signInWithPassword(yiliCredentials);
  });
  it('Should be able to save and update an indicateur personnalise resultat for an editable collectivite', async () => {
    const endpoint = makeNewIndicateurPersonnaliseResultatWriteEndpoint();
    const indicateurValue: AnyIndicateurValueWrite<number> = {
      annee: 2020,
      valeur: 20.2,
      indicateur_id: 0,
      collectivite_id: 2,
    };
    const insertResult = await endpoint.save(indicateurValue);

    expect(insertResult).not.toBeNull();
    expect(insertResult).toEqual(expect.objectContaining(indicateurValue));
  });
  it('Saving an indicateur perso resultat value for a collectivite readonly should fail', async () => {
    await supabaseClient.auth.signOut(); // Yili signs out
    await supabaseClient.auth.signInWithPassword(yuluCredentials);
    const endpoint = makeNewIndicateurPersonnaliseResultatWriteEndpoint();
    const indicateurValue: AnyIndicateurValueWrite<number> = {
      annee: 2020,
      valeur: 12.4,
      indicateur_id: 0,
      collectivite_id: 2, // Yulu has no right on collectivite #2
    };
    const insertResult = await endpoint.save(indicateurValue);
    expect(endpoint.lastResponse?.status).toBe(403);
    expect(insertResult).toBeNull();
  });
});
