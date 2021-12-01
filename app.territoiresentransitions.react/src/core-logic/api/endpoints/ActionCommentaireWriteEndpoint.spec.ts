import '@testing-library/jest-dom/extend-expect';
import {ActionCommentaireWriteEndpoint} from 'core-logic/api/endpoints/ActionCommentaireWriteEndpoint';
import {supabase} from 'core-logic/api/supabase';
import {ActionCommentaireWrite} from 'generated/dataLayer/action_commentaire_write';

describe('Action-commentaire write endpoint', () => {
  beforeEach(async () => {
    await supabase.auth.signUp({email: 'yili@didi.com', password: 'yolododo'});
    await supabase.auth.signIn({email: 'yili@didi.com', password: 'yolododo'});
  });

  it('Should return an equivalent commentaire when saving a commentaire ', async () => {
    const endpoint = new ActionCommentaireWriteEndpoint();
    const commentaire: ActionCommentaireWrite = {
      epci_id: 1,
      action_id: 'cae_1.2.3.4',
      commentaire: 'yolo',
    };
    const actualCommentaireWrite = await endpoint.save(commentaire);
    expect(actualCommentaireWrite).not.toBeNull();
  });

  it('Should fail when saving a commentaire with bad epci', async () => {
    const endpoint = new ActionCommentaireWriteEndpoint();
    const commentaire: ActionCommentaireWrite = {
      epci_id: 666,
      action_id: 'cae_1.2.3.1',
      commentaire: 'yolo',
    };
    const result = await endpoint.save(commentaire);
    expect(result).toEqual(null);
  });
});
