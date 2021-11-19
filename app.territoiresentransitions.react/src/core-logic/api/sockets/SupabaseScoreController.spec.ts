import {RealtimeClient} from '@supabase/realtime-js';
import { createClient } from '@supabase/supabase-js';
import {ScoreSocket} from 'core-logic/api/sockets/ScoreSocket';
import {SupabaseScoreController} from 'core-logic/api/sockets/SupabaseScoreController';
// import {w3cwebsocket as WebSocket} from 'websocket';
import {Server as WebSocketServer, WebSocket} from 'mock-socket';

describe('Supabase Score Controller ', () => {
  it('Should ', async () => {
    const schema = 'public';
    const tableName = 'client_scores';
    const epciId = 1;

    const topic = `realtime:${schema}:${tableName}:epci_id=${epciId}`;
    // const server = new WS('ws://localhost:1234/');
    const server = new WebSocketServer('ws://localhost:1234');
    // const client = new WebSocket('ws://localhost:1234');
    const localSupabaseClient = new RealtimeClient(
      'ws://localhost:1234/socket'
    );

    localSupabaseClient.connect();
    // console.log(localSupabaseClient);
    // console.log('before await ');
    // await server.;
    // console.log('after await');

    localSupabaseClient.push({
      topic,
      event: 'INSERT',
      payload: {},
      ref: '',
    });

    const controller = new SupabaseScoreController({
      supabaseClient: createClient(
        options: {
          realtime: {

          }
        }
      ),
    });
    const socket = ScoreSocket({controller, epciId});

    // localSupabaseClient.onConnMessage;

    // server.emit({
    //   event: 'INSERT',
    //   data: {
    //     topic: 'lala',
    //     type: 'INSERT',
    //     payload: 'hello',
    //   },
    // });

    // WS.clean();
  });
});
