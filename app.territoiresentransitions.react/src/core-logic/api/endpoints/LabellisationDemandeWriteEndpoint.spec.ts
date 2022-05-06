import '@testing-library/jest-dom/extend-expect';
import {LabellisationDemandeWriteEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {LabellisationDemandeWrite} from 'generated/dataLayer/labellisation_demande_write';
import {yoloCredentials} from 'test_utils/collectivites';

describe('Labellisation demande write endpoint', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yoloCredentials);
  });

  it('Should allow saving and updating a labellisation demande when connected', async () => {
    const endpoint = new LabellisationDemandeWriteEndpoint();
    const demande: LabellisationDemandeWrite = {
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '2',
    };
    const result = await endpoint.save(demande);
    expect(endpoint.lastResponse?.status).toBe(201);
    expect(result).not.toBeNull();
    expect(result).toEqual(expect.objectContaining(demande));
  });
});
