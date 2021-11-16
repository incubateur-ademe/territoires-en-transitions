import '@testing-library/jest-dom/extend-expect';
import {actionStatutReadEndpoint} from 'core-logic/api/endpoints/ActionStatutReadEndpoint';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';

describe('Action-statut repo should retrieve data-layer default statuses', () => {
  it(
    'Retrieves at least one status when epci_id and action_id with status' +
      ' are given',
    async () => {
      const results = await actionStatutRepository.fetch({
        epci_id: 1,
        action_id: 'cae_1',
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].epci_id).toEqual(1);
      expect(results[0].action_id).toEqual('cae_1');
    }
  );
});
