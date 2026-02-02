import { CreatePlanAggregateInput } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.types';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { isPersonneId } from '@tet/domain/collectivites';
import { isEqual } from 'es-toolkit';
import { ImportPlanInput } from '../import-plan.input';
import { ResolvedFicheEntities } from '../resolvers/resolve-entity.service';
import { importFicheInputToUpdateFicheInput } from './import-fiche-input-to-update-fiche-input';

export function importPlanInputToCreatePlanAggregateInput(
  planImport: ImportPlanInput,
  resolvedEntities: ResolvedFicheEntities[],
  collectiviteId: number
): Result<CreatePlanAggregateInput, string> {
  const fichesWithPaths = planImport.fiches.map((ficheImport) => {
    const resolvedEntity = resolvedEntities.find((entity) =>
      isEqual(entity.axisPath, ficheImport.axisPath)
    );

    if (!resolvedEntity) {
      return failure(
        `No resolved entity found for fiche "${ficheImport.titre}" (axisPath: ${
          ficheImport.axisPath?.join(' > ') ?? 'none'
        })`
      );
    }

    return success({
      axisPath: ficheImport.axisPath,
      fiche: importFicheInputToUpdateFicheInput(
        ficheImport,
        resolvedEntity,
        collectiviteId
      ),
    });
  });
  const fichesWithPathsResults = combineResults(fichesWithPaths);
  if (!fichesWithPathsResults.success) {
    return failure(fichesWithPathsResults.error);
  }

  const planCreationRequest: CreatePlanAggregateInput = {
    collectiviteId,
    nom: planImport.nom,
    typeId: planImport.typeId,
    pilotes: planImport.pilotes?.filter(isPersonneId),
    referents: planImport.referents?.filter(isPersonneId),
    fiches: fichesWithPathsResults.data,
  };

  return success(planCreationRequest);
}
