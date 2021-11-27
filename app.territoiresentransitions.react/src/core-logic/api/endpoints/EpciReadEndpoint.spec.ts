import '@testing-library/jest-dom/extend-expect';
import {epciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoint';

describe('Action-statut reading endpoint should retrieve data-layer default statuses', () => {
  it('should retrieve all EPCIs', async () => {
    const results = await epciReadEndpoint.getBy({}); // all

    expect(results.length).toEqual(1628);
    expect(results[0].nom).toEqual('Haut - Bugey Agglomération');
  });
});
