import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { ImportIndicateurDefinitionError } from './import-indicateur-definition.errors';
import type { ImportObjectifType } from './import-indicateur-objectif.dto';

type Objectif = Omit<ImportObjectifType, 'identifiantReferentiel'> & {
  indicateurId: number;
};

export function mapIndicateurObjectifs(
  objectifs: ImportObjectifType[],
  definitions: { id: number; identifiantReferentiel: string | null }[]
): Result<Objectif[], ImportIndicateurDefinitionError> {
  const ids = new Map(
    definitions.map(({ id, identifiantReferentiel }) => [
      identifiantReferentiel,
      id,
    ])
  );
  const mapped: Objectif[] = [];
  for (const { identifiantReferentiel, ...objectif } of objectifs) {
    const indicateurId = ids.get(identifiantReferentiel);
    if (!indicateurId) {
      return failure(
        'INVALID_IMPORT',
        new Error(
          `Objectif associé à un indicateur inconnu: ${identifiantReferentiel}`
        )
      );
    }
    mapped.push({ indicateurId, ...objectif });
  }
  return success(mapped);
}
