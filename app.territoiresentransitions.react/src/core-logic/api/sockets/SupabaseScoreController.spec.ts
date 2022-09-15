import {actionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {ScoreSocket} from 'core-logic/api/sockets/ScoreSocket';
import {SupabaseScoreController} from 'core-logic/api/sockets/SupabaseScoreController';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';
import {sleep} from 'utils/sleep';

describe('Supabase Score Controller', () => {
  const collectiviteId = 1;
  jest.setTimeout(10000);
  // This test needs the business to run !
  it.skip('[Should observe some new scores when saving an action statut (requires that business is running !)', async () => {
    const controller = new SupabaseScoreController({
      supabaseClient: supabaseClient,
    });
    const socket = new ScoreSocket({controller, collectiviteId});
    controller.listen();

    const list_scoreObs = [];
    const list_scores = [];
    socket.scoreObservable.subscribe(e => {
      console.log('obs', e);
      list_scoreObs.push(e);
    });
    socket._scores.subscribe(e => {
      console.log('subj', e);
      list_scores.push(e);
    });

    // connect as Yili
    await supabaseClient.auth.signIn(yiliCredentials);
    // insert a statut (if business is running somewhere)
    await actionStatutWriteEndpoint.save({
      concerne: true,
      avancement: 'fait',
      action_id: 'cae_1.1.1.1.1',
      collectivite_id: 1,
    });
    await sleep(1000);

    expect(list_scoreObs.length).toBeGreaterThan(1);
    expect(list_scores.length).toBeGreaterThan(1);
  });
});
