import {makeAutoObservable} from 'mobx';
import {ClientScoresRead} from '../../generated/dataLayer/client_scores_read';
import {ScoreSocket} from 'core-logic/api/sockets/ScoreSocket';
import {SupabaseScoreController} from 'core-logic/api/sockets/SupabaseScoreController';
import {ScoreController} from './ScoreSocket';
import {supabase} from 'core-logic/api/supabase';

export type CurrentCollectiviteObserved = {
  nom: string;
  collectivite_id: number;
};

// Should observe "CollectiviteId" of collectiviteBloc and ActionStatutWriteEndpoint
// so that you start the connection on first status written
export class ScoreBloc {
  private _collectiviteId: number | null = null;
  private _client_scores: ClientScoresRead[] = [];
  private _scoreController: ScoreController | null = null;
  private _scoreSocket: ScoreSocket | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  openScoreSocketAndListenScoreController() {
    if (this._scoreController !== null) this._scoreController.dispose();
    else if (this._collectiviteId === null) return;
    else {
      this._scoreController = new SupabaseScoreController({
        supabaseClient: supabase,
      });
      this._scoreSocket = new ScoreSocket({
        controller: this._scoreController,
        collectiviteId: this._collectiviteId,
      });
      this._scoreController.listen();
      this._scoreController;
    }
  }
}
