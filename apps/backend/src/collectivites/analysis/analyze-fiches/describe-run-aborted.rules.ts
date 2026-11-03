import { groupBy } from 'es-toolkit';
import { match } from 'ts-pattern';
import { describeClassifyFicheFailure } from '../classify-fiche/describe-classify-fiche-failure.rules';
import { CalculateCollectiviteMobilisationError } from '../score-mobilisation/score-mobilisation.errors';
import {
  RUN_FAILURE_THRESHOLD,
  RunAborted,
  RunFailure,
} from './add-run-failures.rules';

type DescribeRunAborted = (aborted: RunAborted) => string;

export const describeMobilisationFailure = (
  failure: CalculateCollectiviteMobilisationError
): string =>
  match(failure)
    .with(
      { kind: 'collectivite_not_found' },
      { kind: 'collectivite_read_failed' },
      ({ kind }) => kind
    )
    .with(
      { kind: 'leviers_not_scored' },
      ({ unscored }) =>
        `leviers_not_scored (${unscored
          .map(({ levierId, kind }) => `${levierId}: ${kind}`)
          .join(', ')})`
    )
    .exhaustive();

const describeFailureCause = (failure: RunFailure): string =>
  match(failure)
    .with({ kind: 'fiche' }, ({ cause }) => describeClassifyFicheFailure(cause))
    .with({ kind: 'mobilisation' }, ({ cause }) =>
      describeMobilisationFailure(cause)
    )
    .exhaustive();

const toGroupKey = (failure: RunFailure): string =>
  `${failure.collectiviteId} ${failure.kind} ${describeFailureCause(failure)}`;

const toFicheIds = (failures: readonly RunFailure[]): number[] =>
  failures.flatMap((failure) =>
    failure.kind === 'fiche' ? [failure.ficheId] : []
  );

const toGroupLines = (failures: readonly RunFailure[]): string[] => {
  const [firstFailure] = failures;
  if (firstFailure === undefined) {
    return [];
  }
  const cause = describeFailureCause(firstFailure);
  if (firstFailure.kind === 'mobilisation') {
    return [
      `- collectivite ${firstFailure.collectiviteId}: mobilisation failed (${cause})`,
    ];
  }
  const ficheIds = toFicheIds(failures);
  return [
    `- collectivite ${firstFailure.collectiviteId}: classification failed for ${
      ficheIds.length
    } fiche(s) (${cause}): ${ficheIds.join(', ')}`,
  ];
};

export const describeRunAborted: DescribeRunAborted = ({ failures }) =>
  [
    `${failures.length} definitive failure(s), threshold of ${RUN_FAILURE_THRESHOLD} reached`,
    ...Object.values(groupBy(failures, toGroupKey)).flatMap(toGroupLines),
  ].join('\n');
