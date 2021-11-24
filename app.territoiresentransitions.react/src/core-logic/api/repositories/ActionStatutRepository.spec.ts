import '@testing-library/jest-dom/extend-expect';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';

describe('Action-statut repo should retrieve data-layer default statuses', () => {
  it(
    'Retrieves at least one status when epci_id and action_id with status' +
      ' are given',
    async () => {
      const result = await actionStatutRepository.fetch({
        epciId: 1,
        actionId: 'cae_1',
      });
      expect(result).not.toBeNull();
      expect(result!.epci_id).toEqual(1);
      expect(result!.action_id).toEqual('cae_1');
    }
  );
  it('Retrieves nothing when no statut has been inserted for this actionId', async () => {
    const result = await actionStatutRepository.fetch({
      epciId: 1,
      actionId: 'cae_2',
    });
    expect(result).toBeNull();
  });
});
describe(
  'Action-Statut repo can save (or update) a statut of known' +
    ' actionId, when user is authentified ',
  () => {
    it('inserts action statut on action cae_1.2.3', async () => {
      const result = await actionStatutRepository.save({
        epci_id: 1,
        action_id: 'cae_1.2.3',
        avancement: 'fait',
        concerne: true,
      });
      expect(result).not.toBeNull();
      expect(result!.epci_id).toEqual(1);
      expect(result!.action_id).toEqual('cae_1.2.3');
      expect(result!.avancement).toEqual('fait');
    });
  }
);
