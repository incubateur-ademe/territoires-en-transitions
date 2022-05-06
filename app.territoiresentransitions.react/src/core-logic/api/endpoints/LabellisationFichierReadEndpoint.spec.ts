import '@testing-library/jest-dom/extend-expect';
import {labellisationFichierReadEndpoint} from './LabellisationFichierReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';

import {yoloCredentials} from 'test_utils/collectivites';

describe('fichier_preuve for a collectivite and a labellisation demande', () => {
  it('should retrieve fichier_preuve', async () => {
    await supabaseClient.auth.signIn(yoloCredentials);

    const results = await labellisationFichierReadEndpoint.getBy({
      collectivite_id: 1,
      demande_id: 3,
    });

    expect(labellisationFichierReadEndpoint.lastResponse?.status).toBe(200);
    expect(results.length).toBe(0);
    /* TODO: ajouter une entrée dans la base pour tester le retour
    expect(results[0]).toMatchObject({
      bucket_id: '6c299b69-8807-4e9a-8f54-083c3ba69892',
    });
    */
  });
});
