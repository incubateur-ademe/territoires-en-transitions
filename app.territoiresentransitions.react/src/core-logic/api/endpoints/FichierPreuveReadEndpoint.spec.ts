import '@testing-library/jest-dom/extend-expect';
import {fichierPreuveReadEndpoint} from './FichierPreuveReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';

import {collectivite1, yoloCredentials} from 'test_utils/collectivites';

describe('fichier_preuve for a collectivite and an action', () => {
  it('should retrieve fichier_preuve', async () => {
    await supabaseClient.auth.signIn(yoloCredentials);

    const results = await fichierPreuveReadEndpoint({
      collectivite_id: collectivite1.collectivite_id,
      action_id: 'eci_1.3.2',
    });

    expect(results.length).toBe(0);
    /* TODO: ajouter une entrée dans la base pour tester le retour
    expect(results[0]).toMatchObject({
      bucket_id: '6c299b69-8807-4e9a-8f54-083c3ba69892',
    });
    */
  });
});
