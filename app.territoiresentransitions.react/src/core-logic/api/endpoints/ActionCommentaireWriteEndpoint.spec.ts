import '@testing-library/jest-dom/extend-expect';
import {ActionCommentaireWriteEndpoint} from 'core-logic/api/endpoints/ActionCommentaireWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {ActionCommentaireWrite} from 'generated/dataLayer/action_commentaire_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Action-commentaire write endpoint', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });

  it('Should be able to save and update a commentaire', async () => {
    const endpoint = new ActionCommentaireWriteEndpoint();
    const commentaire: ActionCommentaireWrite = {
      collectivite_id: 2,
      action_id: 'cae_1.1.1.1.2',
      commentaire: 'yolo',
    };

    // create
    const createResult = await endpoint.save(commentaire);
    expect(createResult).not.toBeNull();
    expect(createResult).toEqual(expect.objectContaining(commentaire));

    // update
    const updatedCommentaire = {...commentaire, commentaire: 'yoloooo !! '};
    const updatedResult = await endpoint.save(updatedCommentaire);
    expect(endpoint.lastResponse?.status).toBe(201);
    expect(updatedResult).toEqual(expect.objectContaining(updatedCommentaire));
  });

  it('Should fail when saving a commentaire with readonly collectivite', async () => {
    const endpoint = new ActionCommentaireWriteEndpoint();
    const commentaire: ActionCommentaireWrite = {
      collectivite_id: 8, // Yili has no rights on collectivite #8
      action_id: 'cae_1.1.1.1.2',
      commentaire: 'yolo',
    };
    const result = await endpoint.save(commentaire);
    expect(endpoint.lastResponse?.status).toBe(403);
    expect(result).toEqual(null);
  });
});
