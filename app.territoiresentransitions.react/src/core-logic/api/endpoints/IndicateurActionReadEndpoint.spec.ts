import '@testing-library/jest-dom/extend-expect';
import {indicateurActionReadEndpoint} from 'core-logic/api/endpoints/IndicateurActionReadEndpoint';

describe('Indicateur action reading endpoint ', () => {
  it('should retrieve data-layer all indicateur definitions', async () => {
    const results = await indicateurActionReadEndpoint.getBy({});
    expect(results).toHaveLength(157);
  });
});
2;
