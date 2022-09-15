import '@testing-library/jest-dom/extend-expect';
import {FicheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Fiche action write endpoint', () => {
  const fiche: FicheActionWrite = {
    collectivite_id: 2,
    avancement: 'pas_fait',
    uid: '37440546-f389-4d4f-bfdb-b0c94a1bd0f9',
    numerotation: 'A1',
    titre: 'titre',
    description: 'description',
    structure_pilote: 'pilote',
    personne_referente: 'référente',
    elu_referent: 'référent',
    partenaires: 'partenaires',
    budget_global: 10,
    en_retard: false,
    commentaire: 'commentaire',
    date_fin: 'fin',
    date_debut: 'début',
    action_ids: ['cae'],
    indicateur_ids: ['ind0'],
    indicateur_personnalise_ids: [1],
  };

  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });

  it('Should be able to save and update a fiche', async () => {
    const endpoint = new FicheActionWriteEndpoint();

    // create
    const actualCommentaireWrite = await endpoint.save(fiche);
    expect(actualCommentaireWrite).not.toBeNull();
    expect(actualCommentaireWrite).toEqual(expect.objectContaining(fiche));

    // update
    const updatedFiche: FicheActionWrite = {...fiche, avancement: 'fait'};
    const updatedCommentaireWrite = await endpoint.save(updatedFiche);
    expect(actualCommentaireWrite).not.toBeNull();
    expect(updatedCommentaireWrite).toEqual(
      expect.objectContaining(updatedFiche)
    );
  });
  it('Should fail when saving a fiche with readonly collectivite', async () => {
    const endpoint = new FicheActionWriteEndpoint();
    const fiche_with_collectivite_8 = {...fiche, collectivite_id: 8}; // Yili has no rights on collectivite 8
    const result = await endpoint.save(fiche_with_collectivite_8);
    expect(endpoint.lastResponse?.status).toBe(403);
    expect(result).toBeNull();
  });
});
