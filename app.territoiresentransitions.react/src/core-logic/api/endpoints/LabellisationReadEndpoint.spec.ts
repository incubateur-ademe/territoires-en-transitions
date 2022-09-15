import '@testing-library/jest-dom/extend-expect';
import {LabellisationReadEndpoint} from 'core-logic/api/endpoints/LabellisationReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Labellisation reading endpoint', () => {
  it('should not be able to read if not connected', async () => {
    const labellisationReadEndpoint = new LabellisationReadEndpoint([]);
    const results = await labellisationReadEndpoint.getBy({
      collectivite_id: 1,
      referentiel: 'cae',
    });

    expect(results).toHaveLength(0);
  });
  it('should retrieve data-layer default last labellisation for collectivite #1 (for any connected user)', async () => {
    const labellisationReadEndpoint = new LabellisationReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has not rights on collectivite #1
    const results = await labellisationReadEndpoint.getBy({
      collectivite_id: 1,
      referentiel: 'cae',
    });

    expect(results).toHaveLength(1);

    const expectedLabellisationRead: Partial<LabellisationRead> = {
      collectivite_id: 1,
      // obtenue_le: new Date(2020, 1, 1),
      etoiles: 2,
      score_realise: 0.56,
      score_programme: 0.62,
    };
    expect(results[0]).toMatchObject(expectedLabellisationRead);
  });
});
