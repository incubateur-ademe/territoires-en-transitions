import '@testing-library/jest-dom/extend-expect';
import {actionCommentaireRepository} from 'core-logic/api/repositories/ActionCommentaireRepository';
import {supabase} from 'core-logic/api/supabase';

describe('Action-Commentaire repo should retrieve data-layer default commentaire', () => {
  beforeEach(async () => {
    await supabase.auth.signIn({email: 'yolo@dodo.com', password: 'yolododo'});
  });
  it('Retrieves the default commentaire of action cae_1.2.3', async () => {
    const result = await actionCommentaireRepository.fetch({
      collectiviteId: 1,
      actionId: 'cae_1.2.3',
    });
    expect(result).not.toBeNull();
    expect(result!.collectivite_id).toEqual(1);
    expect(result!.commentaire).toEqual('un commentaire');
  });
});

describe(
  'Action-Commentaire repo can save (or update) commentaire of known' +
    ' actionId, when user is authentified ',
  () => {
    it('inserts commentaire on action cae_1.2.3', async () => {
      const result = await actionCommentaireRepository.save({
        collectivite_id: 1,
        action_id: 'cae_1.2.3',
        commentaire: 'un nouveau commentaire',
      });
      expect(result).not.toBeNull();
      expect(result!.collectivite_id).toEqual(1);
      expect(result!.action_id).toEqual('cae_1.2.3');
      expect(result!.commentaire).toEqual('un nouveau commentaire');
    });
  }
);
