import '@testing-library/jest-dom/extend-expect';
import {PersonnalisationRegleReadEndpoint} from 'core-logic/api/endpoints/PersonnalisationRegleReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yoloCredentials, yuluCredentials} from 'test_utils/collectivites';

const EXEMPLE_REGLE = {
  action_id: 'cae_2.2.3.1',
  description: expect.stringContaining(
    '<p>Pour une collectivité hors France Métropolitaine, le statut de la tâche 2.2.3.1 est &quot;non concernée&quot;.</p>'
  ),
  formule: expect.stringContaining('identite(localisation, DOM)'),
  type: 'desactivation',
};

describe('Personnalisation règles reading endpoint', () => {
  it('should return an empty array if there is no regles for an action', async () => {
    const personnalisationRegleReadEndpoint =
      new PersonnalisationRegleReadEndpoint([]);
    await supabaseClient.auth.signIn(yoloCredentials);

    const results = await personnalisationRegleReadEndpoint.getBy({
      action_id: 'nimp',
    });

    expect(results.length).toEqual(0);
  });

  it('should return rules bound to an action', async () => {
    const personnalisationRegleReadEndpoint =
      new PersonnalisationRegleReadEndpoint([]);
    await supabaseClient.auth.signIn(yoloCredentials);

    const results = await personnalisationRegleReadEndpoint.getBy({
      action_id: 'cae_2.2.3.1',
    });

    expect(results.length).toEqual(1);
    expect(results).toMatchObject([EXEMPLE_REGLE]);
  });

  it('should return rules bound to an action when user is not attached to the collectivite', async () => {
    const personnalisationRegleReadEndpoint =
      new PersonnalisationRegleReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials);

    const results = await personnalisationRegleReadEndpoint.getBy({
      action_id: 'cae_2.2.3.1',
    });

    expect(results.length).toEqual(1);
    expect(results).toMatchObject([EXEMPLE_REGLE]);
  });
});
