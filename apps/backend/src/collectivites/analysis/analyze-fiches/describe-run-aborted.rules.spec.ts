import { describe, expect, it } from 'vitest';
import { RunFailure } from './add-run-failures.rules';
import { describeRunAborted } from './describe-run-aborted.rules';

const toFicheFailure = ({
  ficheId,
  collectiviteId,
  httpStatus,
}: {
  ficheId: number;
  collectiviteId: number;
  httpStatus: number;
}): RunFailure => ({
  kind: 'fiche',
  ficheId,
  collectiviteId,
  cause: { kind: 'api_error', httpStatus },
});

describe('describeRunAborted', () => {
  it('regroupe les fiches en échec par CT et par cause, avec le seuil atteint en tête', () => {
    const description = describeRunAborted({
      kind: 'failure_threshold_reached',
      failures: [
        toFicheFailure({
          ficheId: 42083,
          collectiviteId: 4567,
          httpStatus: 400,
        }),
        toFicheFailure({
          ficheId: 42098,
          collectiviteId: 4567,
          httpStatus: 400,
        }),
        toFicheFailure({
          ficheId: 61471,
          collectiviteId: 5012,
          httpStatus: 400,
        }),
        toFicheFailure({
          ficheId: 61480,
          collectiviteId: 5012,
          httpStatus: 503,
        }),
      ],
    });

    expect(description).toBe(
      [
        '4 definitive failure(s), threshold of 10 reached',
        '- collectivite 4567: classification failed for 2 fiche(s) (api_error 400): 42083, 42098',
        '- collectivite 5012: classification failed for 1 fiche(s) (api_error 400): 61471',
        '- collectivite 5012: classification failed for 1 fiche(s) (api_error 503): 61480',
      ].join('\n')
    );
  });

  it("donne la cause d'un engagement en échec, levier par levier", () => {
    const description = describeRunAborted({
      kind: 'failure_threshold_reached',
      failures: [
        {
          kind: 'mobilisation',
          collectiviteId: 4567,
          cause: {
            kind: 'leviers_not_scored',
            collectiviteId: 4567,
            unscored: [
              { levierId: 'covoiturage', kind: 'truncated' },
              { levierId: 'velo_transport_commun', kind: 'api_error' },
            ],
          },
        },
      ],
    });

    expect(description).toBe(
      [
        '1 definitive failure(s), threshold of 10 reached',
        '- collectivite 4567: mobilisation failed (leviers_not_scored (covoiturage: truncated, velo_transport_commun: api_error))',
      ].join('\n')
    );
  });
});
