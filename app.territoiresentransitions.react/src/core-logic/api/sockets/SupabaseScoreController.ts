import {ScoreController, ClientScoreBatchRead} from './ScoreSocket';
import {
  RealtimeSubscription,
  SupabaseClient,
  SupabaseRealtimePayload,
} from '@supabase/supabase-js';

export class SupabaseScoreController extends ScoreController {
  private subscription: RealtimeSubscription | null = null;
  private supabaseClient: SupabaseClient;

  constructor({supabaseClient}: {supabaseClient: SupabaseClient}) {
    super();
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

  private handlePayload(
    payload: SupabaseRealtimePayload<ClientScoreBatchRead>
  ) {
    this.handleScores(payload.new);
  }

  private subscribe() {
    if (!this._scoreSocket)
      throw Error('Score socket is null; cannot subscribe !');
    if (this.subscription)
      throw Error('Already subscribed, cannot listen twice.');
    const subscribeTo = `client_scores:collectivite_id=eq.${this._scoreSocket?.collectiviteId}`;
    this.subscription = this.supabaseClient
      .from<ClientScoreBatchRead>(subscribeTo)
      .on('INSERT', payload => this.handlePayload(payload))
      .on('UPDATE', payload => this.handlePayload(payload))
      .subscribe();
    console.log('Successfully subscribed to ', subscribeTo);
  }
}
