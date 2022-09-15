import '@testing-library/jest-dom/extend-expect';
import {FicheActionReadEndpoint} from 'core-logic/api/endpoints/FicheActionReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Fiche action reading endpoint', () => {
  it('should not be able to read if not connected', async () => {
    const ficheActionReadEndpoint = new FicheActionReadEndpoint([]);
    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toHaveLength(0);
  });

  it('should retrieve data-layer default fiche for collectivite #1 (for any connected user)', async () => {
    const ficheActionReadEndpoint = new FicheActionReadEndpoint([]);

    await supabaseClient.auth.signIn(yuluCredentials); // Yulu is connected with no rights on collectivite #1

    const results = await ficheActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(ficheActionReadEndpoint.lastResponse?.status).toBe(200);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const partialExpectedReadFicheAction: Partial<FicheActionRead> = {
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
      numerotation: 'A0',
      partenaires: 'partenaires',
      personne_referente: 'référente',
      structure_pilote: 'pilote',
      titre: 'titre',
      uid: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    };
    expect(results[0]).toMatchObject(partialExpectedReadFicheAction);
  });
});
