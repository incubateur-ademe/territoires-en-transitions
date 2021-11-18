import {supabase} from 'core-logic/api/supabase';
import {Observable, Subject} from 'rxjs';
import {ScoreRead} from 'generated/dataLayer/score_read';
import {
  RealtimeSubscription,
  SupabaseRealtimePayload,
} from '@supabase/supabase-js';

class ScoreSocket {
  private epciId: number;
  private payloads = new Subject<SupabaseRealtimePayload<ScoreRead[]>>();
  private scores = new Subject<ScoreRead[]>();
  private subscription: RealtimeSubscription | null = null;

  constructor({epciId}: {epciId: number}) {
    this.epciId = epciId;
  }

  start() {
    this.listenToPayloads();
    this.subscribe();
  }

  stop() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private listenToPayloads() {}

  private subscribe() {
    if (this.subscription) throw 'Already subscribed, cannot listen twice.';
    this.subscription = supabase
      .from<ScoreRead>(`score:epci_id=${this.epciId}`)
      .on('INSERT', payload => this.payloads.next(payload))
      .on('UPDATE', payload => this.payloads.next(payload))
      .subscribe();
  }
}
