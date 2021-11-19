import {
  ClientScoreBatchRead,
  InMemoryScoreController,
  ScoreSocket,
} from './ScoreSocket';
import type {ScoreRead} from 'generated/dataLayer/score_read';
import {takeUntil} from 'rxjs/operators';
import {timer} from 'rxjs';

const makeScoreRead = ({
  epciId = 1,
  action_id = 'cae_1',
}: {
  epciId?: number;
  action_id?: string;
}): ScoreRead => {
  return {
    id: 1,
    epci_id: epciId,
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
    const scoreRead1 = makeScoreRead({epciId: 1, action_id: 'cae_1'});
    const scoreRead2 = makeScoreRead({epciId: 1, action_id: 'cae_2'});

    const clientScores: ClientScoreBatchRead[] = [
      {
        id: 1,
        epci_id: 1,
        referentiel: 'cae',
        scores: [scoreRead1, scoreRead2],
        score_created_at: '2020-01-01',
      },
    ];

    const epciId = 1;

    const controller = new InMemoryScoreController({
      clientScores,
    });
    const socket = new ScoreSocket({epciId, controller});

    const timelimit = timer(5);

    socket.scoreObservable
      .pipe(takeUntil(timelimit))
      .subscribe(actualScoreReads =>
        expect(actualScoreReads).toBe([scoreRead1, scoreRead2])
      );
    controller.listen();
  });
});
