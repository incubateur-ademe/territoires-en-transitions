import '@testing-library/jest-dom/extend-expect';
import {FicheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';
import {supabase} from 'core-logic/api/supabase';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Fiche action write endpoint', () => {
  beforeEach(async () => {
    await supabase.auth.signIn(yiliCredentials);
  });

  it('Should return an equivalent fiche when saving a fiche ', async () => {
    const endpoint = new FicheActionWriteEndpoint();
    const fiche: FicheActionWrite = {
      collectivite_id: 1,
      avancement: 'pas_fait',
      uid: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      numerotation: 'A1',
      titre: 'titre http',
      description: 'description',
      structure_pilote: 'pilote',
      personne_referente: 'référente',
      elu_referent: 'référent',
      partenaires: 'partenaires',
      budget_global: '€',
      commentaire: 'commentaire',
      date_fin: 'fin',
      date_debut: 'début',
      action_ids: ['cae'],
      indicateur_ids: ['ind0'],
      indicateur_personnalise_ids: [1],
    };
    const actualCommentaireWrite = await endpoint.save(fiche);
    expect(actualCommentaireWrite).not.toBeNull();
  });

  it('Should fail when saving a commentaire with bad epci', async () => {
    const endpoint = new FicheActionWriteEndpoint();
    const fiche: FicheActionWrite = {
      collectivite_id: 10000,
      avancement: 'pas_fait',
      uid: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      numerotation: 'A1',
      titre: 'titre http',
      description: 'description',
      structure_pilote: 'pilote',
      personne_referente: 'référente',
      elu_referent: 'référent',
      partenaires: 'partenaires',
      budget_global: '€',
      commentaire: 'commentaire',
      date_fin: 'fin',
      date_debut: 'début',
      action_ids: ['cae'],
      indicateur_ids: ['ind0'],
      indicateur_personnalise_ids: [1],
    };
    const result = await endpoint.save(fiche);
    expect(result).toEqual(null);
  });
});
