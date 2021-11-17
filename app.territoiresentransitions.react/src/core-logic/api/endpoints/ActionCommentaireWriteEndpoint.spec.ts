import '@testing-library/jest-dom/extend-expect';
import {ActionCommentaireWriteEndpoint} from 'core-logic/api/endpoints/ActionCommentaireWriteEndpoint';
import {ActionCommentaireWrite} from 'generated/dataLayer/action_commentaire_write';

describe('Action-commentaire write endpoint', () => {
  it('Saving a commentaire should return an equivalent commentaire', async () => {
    const endpoint = new ActionCommentaireWriteEndpoint();
    const commentaire: ActionCommentaireWrite = {
      epci_id: 1,
      action_id: 'cae_1.2.3.1',
      commentaire: 'yolo',
    };
    const result = await endpoint.save(commentaire);
    expect(result!.epci_id).toEqual(commentaire.epci_id);
    expect(result!.commentaire).toEqual(commentaire.commentaire);
    expect(result!.action_id).toEqual(commentaire.action_id);
  });

  it('Saving a commentaire with bad epci should fail', async () => {
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
