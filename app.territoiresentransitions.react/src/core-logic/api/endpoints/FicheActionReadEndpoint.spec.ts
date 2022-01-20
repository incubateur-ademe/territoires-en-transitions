import '@testing-library/jest-dom/extend-expect';
import {ficheActionReadEndpoint} from 'core-logic/api/endpoints/FicheActionReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Fiche action reading endpoint ', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });

  it('should retrieve data-layer default fiche for collectivite #1 ', async () => {
    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(ficheActionReadEndpoint.lastResponse?.status).toBe(200);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const partialExpectedReadFicheAction = {
      action_ids: [],
      avancement: 'pas_fait',
      budget_global: 0,
      collectivite_id: 1,
      commentaire: 'commentaire',
      date_debut: 'début',
      date_fin: 'fin',
      description: 'description',
      elu_referent: 'référent',
      en_retard: false,
      indicateur_ids: [],
      indicateur_personnalise_ids: [],
      modified_at: '2022-01-20T13:33:54.149837+00:00',
      numerotation: 'A0',
      partenaires: 'partenaires',
      personne_referente: 'référente',
      structure_pilote: 'pilote',
      titre: 'titre',
      uid: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    };
    expect(results[0]).toEqual(
      expect.objectContaining(partialExpectedReadFicheAction)
    );
  });
  it('should retrieve 0 fiches for collectivite #2 ', async () => {
    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: 2,
    });
    expect(ficheActionReadEndpoint.lastResponse?.status).toBe(200);
    expect(results.length).toEqual(0);
  });
});
2;
