import '@testing-library/jest-dom/extend-expect';
import {
  allCollectiviteReadEndpoint,
  elsesCollectiviteReadEndpoint,
  ownedCollectiviteReadEndpoint,
} from 'core-logic/api/endpoints/CollectiviteReadEndpoints';
import {supabase} from 'core-logic/api/supabase';
import {ElsesCollectiviteRead} from 'generated/dataLayer';
import {OwnedCollectiviteRead} from 'generated/dataLayer/owned_collectivite_read';

import {
  collectivite1,
  collectivite2,
  yoloCredentials,
  yuluCredentials,
} from 'test_utils/collectivites';

describe('All Collectivite reading endpoint should retrieve 1628 Collectivites', () => {
  it('should retrieve all Collectivites sorted by nom if no arguments are given', async () => {
    const results = await allCollectiviteReadEndpoint.getBy({}); // all

    expect(results.length).toEqual(1628);
    expect(results[0].nom).toEqual('Ardenne Métropole');
  });
});

describe('Elses Collectivite reading endpoint should retrieve only claimed Collectivite', () => {
  it('should retrieve one active Collectivite if a given id is given', async () => {
    const results = await elsesCollectiviteReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results.length).toEqual(1);
    const expected: ElsesCollectiviteRead[] = [collectivite1];
    expect(results[0]).toEqual(expected[0]);
  });
  it("should retrieve else's active Collectivite (3) if no siren is given", async () => {
    await supabase.auth.signIn(yoloCredentials);
    const results = await elsesCollectiviteReadEndpoint.getBy({});
    expect(results.length).toEqual(3);
  });
});

describe('Owned Collectivite reading endpoint ', () => {
  it('should retrieve 2 Collectivites for Yolo (referent and agent)', async () => {
    await supabase.auth.signIn(yoloCredentials);
    const results = await ownedCollectiviteReadEndpoint.getBy({});
    const expectedResults: OwnedCollectiviteRead[] = [
      {
        ...collectivite2,
        role_name: 'agent',
      },
      {
        ...collectivite1,
        role_name: 'referent',
      },
    ];
    expect(results.length).toEqual(2);
    expect(results).toEqual(expectedResults);
  });
  it('should retrieve 0 Collectivite for Yulu', async () => {
    await supabase.auth.signIn(yuluCredentials);
    const results = await ownedCollectiviteReadEndpoint.getBy({});
    expect(results).toEqual([]);
  });
});
