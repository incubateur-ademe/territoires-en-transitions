import '@testing-library/jest-dom/extend-expect';
import {clientScoresReadEndpoint} from 'core-logic/api/endpoints/ClientScoresReadEndpoint';

describe('ClientScores reading endpoint ', () => {
  it('should retrieve data-layer 1 row for collectivite #1 ', async () => {
    const results = await clientScoresReadEndpoint.getBy({
      collectiviteId: 1,
      referentiel: 'cae',
    });

    expect(results).toHaveLength(1);
    expect(results[0].scores).toHaveLength(2); // Fix datalayer `duplicate key value violates unique constraint` on second insert should fix this test.
  });
  it('should retrieve 0 commentaire for collectivite #2 ', async () => {
    const results = await clientScoresReadEndpoint.getBy({
      collectiviteId: 2,
    });
    expect(results.length).toEqual(0);
  });
});
