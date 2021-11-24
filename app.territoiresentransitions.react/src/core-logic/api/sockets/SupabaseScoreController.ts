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
    this.subscribe();
  }

  private handlePayload(
    payload: SupabaseRealtimePayload<ClientScoreBatchRead>
  ) {
    this.handleScores(payload.new);
  }

  private subscribe() {
    if (!this._scoreSocket) throw 'Score socket is null; cannot subscribe !';
    if (this.subscription) throw 'Already subscribed, cannot listen twice.';
    this.subscription = this.supabaseClient
      .from<ClientScoreBatchRead>(
        // todo filter by epci col :epci_id=${this._scoreSocket?.epciId}
        'client_scores'
      )
      .on('INSERT', payload => this.handlePayload(payload))
      .on('UPDATE', payload => this.handlePayload(payload))
      .subscribe();
  }
}
