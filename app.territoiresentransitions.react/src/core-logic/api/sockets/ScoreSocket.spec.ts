import {
  ClientScoreBatchRead,
  InMemoryScoreController,
  ScoreSocket,
} from './ScoreSocket';
import type {ActionScore} from 'generated/dataLayer/score_read/ActionScore';
import {takeUntil} from 'rxjs/operators';
import {timer} from 'rxjs';

const makeScoreRead = ({
  collectiviteId = 1,
  action_id = 'cae_1',
}: {
  collectiviteId?: number;
  action_id?: string;
}): ActionScore => {
  return {
    id: 1,
    collectivite_id: collectiviteId,
    action_id: action_id,
    completed_taches_count: 10,
    total_taches_count: 12,
    concernee: true,
    points: 100,
    potentiel: 100,
    previsionnel: 100,
    referentiel_points: 100,
    created_at: '2021-01-01',
  };
};

describe('Score socket ', () => {
  it('Should expose ReadScores when Client Scores payloads are published', async () => {
    const scoreRead1 = makeScoreRead({collectiviteId: 1, action_id: 'cae_1'});
    const scoreRead2 = makeScoreRead({collectiviteId: 1, action_id: 'cae_2'});

    const clientScores: ClientScoreBatchRead[] = [
      {
        id: 1,
        collectivite_id: 1,
        referentiel: 'cae',
        scores: [scoreRead1, scoreRead2],
        score_created_at: '2020-01-01',
      },
    ];

    const collectiviteId = 1;

    const controller = new InMemoryScoreController({
      clientScores,
    });
    const socket = new ScoreSocket({collectiviteId, controller});

    const timelimit = timer(5);
    let result;
    socket.scoreObservable
      .pipe(takeUntil(timelimit))
      .subscribe(actualScoreReads => {
        result = actualScoreReads;
      });
    controller.listen();
    expect(result).toStrictEqual([scoreRead1, scoreRead2]);
  });
});
