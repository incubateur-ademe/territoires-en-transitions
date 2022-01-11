import {actionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {ScoreSocket} from 'core-logic/api/sockets/ScoreSocket';
import {SupabaseScoreController} from 'core-logic/api/sockets/SupabaseScoreController';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';
import {sleep} from 'utils/sleep';

describe('Supabase Score Controller ', () => {
  const collectiviteId = 1;
  jest.setTimeout(10000);
  it('[Should observe some new scores when saving an action statut (requires that business is running !) ', async () => {
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

// describe('Supabase Score Controller ', () => {
//   const schema = 'public';
//   const readTableName = 'client_scores';
//   const collectiviteId = 1;

//   it('[TEMPORARY TEST] should publish a score in socket when score is written directly in client score table ', async () => {
//     const controller = new SupabaseScoreController({
//       supabaseClient: supabase,
//     });
//     const socket = new ScoreSocket({controller, collectiviteId});

//     // Mimic server
//     const writeScore = {
//       action_id: 'cae_1.2.3',
//       completed_taches_count: 1,
//       concernee: true,
//       collectivite_id: 1,
//       points: 100,
//       potentiel: 100,
//       previsionnel: 100,
//       referentiel_points: 100,
//       total_taches_count: 100,
//     };

//     const expectedScoreRead: ScoreRead = {
//       id: 1,
//       created_at: '2021-01-01',
//       ...writeScore,
//     };

//     let actual: ScoreRead[] = [];
//     socket.scoreObservable.subscribe(actualScoreReads => {
//       actual = actualScoreReads;
//       console.log('actualScoreReads -> -> ', actualScoreReads);
//     });

//     controller.listen();

//     const writeTableName = 'score';
//     const insertResponse = await supabase
//       .from(writeTableName)
//       .upsert(writeScore);

//     console.log('insertResponse : ', insertResponse);

//     socket.scoreObservable.subscribe(e => console.log('obs', e));
//     socket._scores.subscribe(e => console.log('subj', e));

//     await sleep(3000);

//     expect(actual).toHaveLength(1);
//     expect(actual[0]).toStrictEqual(expectedScoreRead);
//   });

//   it.skip('Should ', async () => {
//     const topic = `realtime:${schema}:${readTableName}:collectivite_id=${collectiviteId}`;
//     // const server = new WS('ws://localhost:1234/');
//     const server = new WebSocketServer('ws://localhost:1234');
//     // const client = new WebSocket('ws://localhost:1234');
//     const localSupabaseClient = new RealtimeClient(
//       'ws://localhost:1234/socket'
//     );

//     localSupabaseClient.connect();
//     // console.log(localSupabaseClient);
//     // console.log('before await ');
//     // await server.;
//     // console.log('after await');

//     localSupabaseClient.push({
//       topic,
//       event: 'INSERT',
//       payload: {},
//       ref: '',
//     });

//     const controller = new SupabaseScoreController({
//       supabaseClient: supabase,
//     });
//     const socket = new ScoreSocket({controller, collectiviteId});

//     // localSupabaseClient.onConnMessage;

//     // server.emit({
//     //   event: 'INSERT',
//     //   data: {
//     //     topic: 'lala',
//     //     type: 'INSERT',
//     //     payload: 'hello',
//     //   },
//     // });

//     // WS.clean();
//   });
// });
