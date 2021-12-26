import {makeAutoObservable, reaction} from 'mobx';
import {ScoreRead} from '../../generated/dataLayer/client_scores_read';
import {ScoreController, ScoreSocket} from 'core-logic/api/sockets/ScoreSocket';
import {SupabaseScoreController} from 'core-logic/api/sockets/SupabaseScoreController';
import {supabaseClient} from 'core-logic/api/supabase';
import {clientScoresReadEndpoint} from 'core-logic/api/endpoints/ClientScoresReadEndpoint';
import {currentCollectiviteBloc} from 'core-logic/observables';

export type CurrentCollectiviteObserved = {
  nom: string;
  collectivite_id: number;
};

// Should observe "CollectiviteId" of collectiviteBloc and ActionStatutWriteEndpoint
// so that you start the connection on first status written
export class ScoreBloc {
  private _collectiviteId: number | null = null;
  private _scores: ScoreRead[] = [];
  private _scoreController: ScoreController | null = null;
  private _scoreSocket: ScoreSocket | null = null;

  constructor() {
    makeAutoObservable(this);
    if (currentCollectiviteBloc.collectiviteId !== null)
      this.fetchScoresForCollectivite(currentCollectiviteBloc.collectiviteId);

    // listen to currentCollectiviteBloc changes
    reaction(
      () => currentCollectiviteBloc.collectiviteId,
      collectiviteId => {
        console.log('bloc reaction collectiviteId , ', collectiviteId);
        if (collectiviteId !== null)
          this.fetchScoresForCollectivite(collectiviteId);
      }
    );
  }

  private fetchScoresForCollectivite(
    // ForReferentiel
    collectiviteId: number
    // referentiel: 'cae' | 'eci'
  ) {
    clientScoresReadEndpoint
      .getBy({
        collectiviteId,
        // referentiel,
      })
      .then(clientScoresRead => {
        if (clientScoresRead[0]) {
          this._scores = clientScoresRead[0].scores;
        }
      });
    console.log('fetchScoresForCollectivite ', this._scores);
  }

  openScoreSocketAndListenScoreController() {
    if (this._scoreController !== null) this._scoreController.dispose();
    else if (this._collectiviteId === null) return;
    else {
      this._scoreController = new SupabaseScoreController({
        supabaseClient,
      });
      this._scoreSocket = new ScoreSocket({
        controller: this._scoreController,
        collectiviteId: this._collectiviteId,
      });
      this._scoreController.listen();
      this._scoreController;
    }
  }
  getScore(action_id: string) {
    const score = this._scores.find(() =>
      this._scores.find(score => score.action_id === action_id)
    );
    return score ? {...score} : null;
  }
}

export const scoreBloc = new ScoreBloc();
