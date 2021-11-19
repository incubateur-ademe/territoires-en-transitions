import {supabase} from 'core-logic/api/supabase';
import {
  RealtimeSubscription,
  SupabaseRealtimePayload,
} from '@supabase/supabase-js';

class SupabaseScoreController extends ScoreController {
  private subscription: RealtimeSubscription | null = null;

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
    this.subscription = supabase
      .from<ClientScoreBatchRead>(
        `client_scores:epci_id=${this._scoreSocket?.epciId}`
      )
      .on('INSERT', payload => this.handlePayload(payload))
      .on('UPDATE', payload => this.handlePayload(payload))
      .subscribe();
  }
}
