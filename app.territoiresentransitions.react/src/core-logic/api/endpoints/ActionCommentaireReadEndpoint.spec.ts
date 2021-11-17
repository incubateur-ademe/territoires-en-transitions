import '@testing-library/jest-dom/extend-expect';
import {actionCommentaireReadEndpoint} from 'core-logic/api/endpoints/ActionCommentaireReadEndpoint';

describe('Action-commentaire reading endpoint should retrieve data-layer default statuses', () => {
  it('Retrieves at least one status when epci_id is given', async () => {
    const results = await actionCommentaireReadEndpoint.getBy({epci_id: 1});

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].epci_id).toEqual(1);
  });
  it(
    'Retrieves at least one status when epci_id and action_id with status' +
      ' are given',
    async () => {
      const results = await actionCommentaireReadEndpoint.getBy({
        epci_id: 1,
        action_id: 'cae_1.2.3.1',
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].epci_id).toEqual(1);
      expect(results[0].action_id).toEqual('cae_1.2.3.1');
    }
  );
  it(
    'Retrieves no statuses when epci_id and action_id without status are' +
      ' given',
    async () => {
      const results = await actionCommentaireReadEndpoint.getBy({
        epci_id: 1,
        action_id: 'test_1',
      });
      expect(results.length).toEqual(0);
    }
  );
});
