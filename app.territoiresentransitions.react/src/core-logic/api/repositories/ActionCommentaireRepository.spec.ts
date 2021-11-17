import '@testing-library/jest-dom/extend-expect';
import {actionCommentaireRepository} from 'core-logic/api/repositories/ActionCommentaireRepository';

describe('Action-Commentaire repo should retrieve data-layer default commentaire', () => {
  it('Retrieves the default commentaire of action cae_1.2.3', async () => {
    const result = await actionCommentaireRepository.fetch({
      epciId: 1,
      actionId: 'cae_1.2.3',
    });
    expect(result).not.toBeNull();
    expect(result!.epci_id).toEqual(1);
    expect(result!.commentaire).toEqual('un commentaire');
  });
});

describe(
  'Action-Commentaire repo can save (or update) commentaire of known' +
    ' actionId, when user is authentified ',
  () => {
    it('inserts commentaire on action cae_1.2.3', async () => {
      const result = await actionCommentaireRepository.save({
        epci_id: 1,
        action_id: 'cae_1.2.3',
        commentaire: 'un nouveau commentaire',
      });
      expect(result).not.toBeNull();
      expect(result!.epci_id).toEqual(1);
      expect(result!.action_id).toEqual('cae_1.2.3');
      expect(result!.commentaire).toEqual('un nouveau commentaire');
    });
  }
);
