import '@testing-library/jest-dom/extend-expect';
import {ActionCommentaireReadEndpoint} from 'core-logic/api/endpoints/ActionCommentaireReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Action-commentaire reading endpoint', () => {
  it('should not be able to read if not connected', async () => {
    const actionCommentaireReadEndpoint = new ActionCommentaireReadEndpoint([]);
    const results = await actionCommentaireReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toHaveLength(0);
  });
  it('should retrieve data-layer default commentaire for collectivite #1 (for anyone connected)', async () => {
    const actionCommentaireReadEndpoint = new ActionCommentaireReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu is connected but has no rights on collectivite #1

    const results = await actionCommentaireReadEndpoint.getBy({
      collectivite_id: 1,
    });
    expect(actionCommentaireReadEndpoint.lastResponse?.status).toBe(200);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const partialExpectedReadCommentaire = {
      collectivite_id: 1,
      commentaire: 'un commentaire',
      action_id: 'cae_1.2.3',
    };
    expect(results[0]).toEqual(
      expect.objectContaining(partialExpectedReadCommentaire)
    );
  });
});
