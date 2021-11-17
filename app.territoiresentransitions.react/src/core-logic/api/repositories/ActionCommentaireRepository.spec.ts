import '@testing-library/jest-dom/extend-expect';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';
import {actionStatutReadEndpoint} from 'core-logic/api/endpoints/ActionStatutReadEndpoint';
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
