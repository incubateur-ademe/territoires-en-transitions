import '@testing-library/jest-dom/extend-expect';
import {
  allEpciReadEndpoint,
  activeEpciReadEndpoint,
  ownedEpciReadEndpoint,
} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {supabase} from 'core-logic/api/supabase';
import {ActiveEpciRead} from 'generated/dataLayer';
import {OwnedEpciRead} from 'generated/dataLayer/owned_epci_read';

import {epci1, epci2, yoloCredentials, yuluCredentials} from 'test_utils/epci';

describe('All EPCI reading endpoint should retrieve 1628 EPCIs', () => {
  it('should retrieve all EPCIs sorted by nom if no arguments are given', async () => {
    const results = await allEpciReadEndpoint.getBy({}); // all

    expect(results.length).toEqual(1628);
    expect(results[0].nom).toEqual('Ardenne Métropole');
  });
});

describe('Active EPCI reading endpoint should retrieve only claimed EPCI', () => {
  it('should retrieve one active EPCI if a given siren is given', async () => {
    const results = await activeEpciReadEndpoint.getBy({siren: '200042935'});

    expect(results.length).toEqual(1);
    const expected: ActiveEpciRead[] = [{...epci1, role_name: null}];
    expect(results).toEqual(expected);
  });
  it('should retrieve all active EPCI if no siren is given', async () => {
    const results = await activeEpciReadEndpoint.getBy({});
    expect(results.length).toEqual(2);
  });
});

describe('Owned EPCI reading endpoint ', () => {
  it('should retrieve 2 EPCIs for Yolo (referent and agent)', async () => {
    await supabase.auth.signIn(yoloCredentials);
    const results = await ownedEpciReadEndpoint.getBy({});
    const expectedResults: OwnedEpciRead[] = [
      {
        ...epci2,
        role_name: 'agent',
      },
      {
        ...epci1,
        role_name: 'referent',
      },
    ];
    expect(results.length).toEqual(2);
    expect(results).toEqual(expectedResults);
  });
  it('should retrieve 0 EPCI for Yulu', async () => {
    await supabase.auth.signIn(yuluCredentials);
    const results = await ownedEpciReadEndpoint.getBy({});
    expect(results.length).toEqual(0);
  });
});
