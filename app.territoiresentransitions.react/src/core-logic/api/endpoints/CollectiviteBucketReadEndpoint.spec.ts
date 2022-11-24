import '@testing-library/jest-dom/extend-expect';
import {collectiviteBucketReadEndpoint} from './CollectiviteBucketReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';

import {collectivite1, yuluCredentials} from 'test_utils/collectivites';

describe('Collectivite bucket', () => {
  it('should retrieve bucket_id from collectivite_id', async () => {
    await supabaseClient.auth.signInWithPassword(yuluCredentials);

    const results = await collectiviteBucketReadEndpoint.getBy({
      collectivite_id: collectivite1.collectivite_id,
    });

    expect(results.length).toBe(1);
  });
});
