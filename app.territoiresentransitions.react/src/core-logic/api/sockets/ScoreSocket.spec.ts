import {
  ClientScoreBatchRead,
  InMemoryScoreController,
  ScoreSocket,
} from './ScoreSocket';
import {takeUntil} from 'rxjs/operators';
import {timer} from 'rxjs';
import {ActionScore} from 'types/ClientScore';
import {Referentiel} from 'types/litterals';

const makeScoreRead = ({
  referentiel = 'cae',
  action_id = 'cae_1',
}: {
  collectiviteId?: number;
  action_id?: string;
  referentiel: Referentiel;
}): ActionScore => {
  return {
    referentiel: referentiel,
    action_id: action_id,
    point_fait: 100,
    point_programme: 100,
    point_pas_fait: 100,
    point_non_renseigne: 100,
    point_potentiel: 100,
    point_referentiel: 100,
    concerne: true,
    total_taches_count: 12,
    completed_taches_count: 10,
    point_potentiel_perso: undefined,
    desactive: false,
  };
};

describe('Score socket', () => {
  it('Should expose ReadScores when Client Scores payloads are published', async () => {
    const scoreRead1 = makeScoreRead({action_id: 'cae_1', referentiel: 'cae'});
    const scoreRead2 = makeScoreRead({action_id: 'cae_2', referentiel: 'cae'});

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
