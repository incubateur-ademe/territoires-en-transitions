import {ClientScoreBatchRead} from 'core-logic/api/sockets/ScoreSocket';
import {supabaseClient} from 'core-logic/api/supabase';
import {sleep} from 'utils/sleep';
import {
  RealtimeSubscription,
  SupabaseClient,
  SupabaseRealtimePayload,
} from '@supabase/supabase-js';

describe('Supabase diag', () => {
  // This test needs the business to run !
  jest.setTimeout(100000);
  it.skip('[Should observe some new scores when saving an action statut (requires that business is running !)', async () => {
    const controller = new SupabaseController({
      supabaseClient: supabaseClient,
    });

    controller.listen();
    await sleep(100000);
  });
});

class SupabaseController {
  private subscription: RealtimeSubscription | null = null;
  private supabaseClient: SupabaseClient;

  constructor({supabaseClient}: {supabaseClient: SupabaseClient}) {
    this.supabaseClient = supabaseClient;
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  listen() {
    console.log('Supabase score controller listen ! ');
    this.subscribe();
  }

  private handlePayload(payload: SupabaseRealtimePayload<unknown>) {
    console.log(payload);
  }

  private subscribe() {
    if (this.subscription)
      throw Error('Already subscribed, cannot listen twice.');
    this.subscription = this.supabaseClient
      .from<ClientScoreBatchRead>(
        // todo filter by collectivite col :collectivite_id=${this._scoreSocket?.collectiviteId}
        '*'
      )
      .on('INSERT', payload => this.handlePayload(payload))
      .on('UPDATE', payload => this.handlePayload(payload))
      .subscribe();
  }
}
