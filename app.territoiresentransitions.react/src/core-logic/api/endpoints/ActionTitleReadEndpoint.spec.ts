import '@testing-library/jest-dom/extend-expect';
import {
  ActionTitleRead,
  actionTitleReadEndpoint,
} from 'core-logic/api/endpoints/ActionTitleReadEndpoint';

describe('Action title endpoint', () => {
  it('should retrieve all titles', async () => {
    const partialTitle: Partial<ActionTitleRead> = {
      id: 'eci_1.1.1',
    };
    const results = await actionTitleReadEndpoint.getBy({});

    expect(results).toEqual(
      expect.arrayContaining([expect.objectContaining(partialTitle)])
    );
  });

  it('should retrieve only title for a given referentiel', async () => {
    const partialEciTitle: Partial<ActionTitleRead> = {
      id: 'eci_1.1.1',
    };
    const partialCaeTitle: Partial<ActionTitleRead> = {
      id: 'cae_1.1.1',
    };
    const results = await actionTitleReadEndpoint.getBy({referentiel: 'cae'});

    expect(results).toEqual(
      expect.arrayContaining([expect.objectContaining(partialCaeTitle)])
    );

    expect(results).not.toEqual(
      expect.arrayContaining([expect.objectContaining(partialEciTitle)])
    );
  });
});
