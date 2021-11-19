import {BehaviorSubject, Observable} from 'rxjs';
import {ScoreRead} from 'generated/dataLayer/score_read';
import {Referentiel} from 'types';

export interface ClientScoreBatchRead {
  // TODO : move elsewhere.
  id: number;
  epci_id: number;
  referentiel: Referentiel;
  scores: ScoreRead[];
  score_created_at: string;
}
export class ScoreSocket {
  epciId: number;
  _scores = new BehaviorSubject<ScoreRead[]>([]);

  get scoreObservable(): Observable<ScoreRead[]> {
    return this._scores.pipe();
  }

  constructor({
    epciId,
    controller,
  }: {
    epciId: number;
    controller: ScoreController;
  }) {
    this.epciId = epciId;
    controller.init(this);
  }
}

abstract class ScoreController {
  _scoreSocket: ScoreSocket | null = null;

  init(scoreSocket: ScoreSocket) {
    this._scoreSocket = scoreSocket;
  }

  handleScores(clientScores: ClientScoreBatchRead) {
    if (!this._scoreSocket)
      throw 'Score socket is null; cannot handle scores !';
    const scoreReads = clientScores.scores;
    this._scoreSocket._scores.next(scoreReads);
  }

  abstract dispose(): void;
  abstract listen(): void;
}

export class InMemoryScoreController extends ScoreController {
  private clientScores: ClientScoreBatchRead[];
  constructor({clientScores}: {clientScores: ClientScoreBatchRead[]}) {
    super();
    this.clientScores = clientScores;
  }
  dispose() {}
  listen() {
    this.clientScores.map(clientScores => this.handleScores(clientScores));
  }
}
