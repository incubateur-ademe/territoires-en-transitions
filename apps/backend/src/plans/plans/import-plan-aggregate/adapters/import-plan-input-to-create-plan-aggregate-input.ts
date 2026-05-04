import { CreatePlanAggregateInput } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.types';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { isPersonneId } from '@tet/domain/collectivites';
import { ImportPlanInput } from '../import-plan.input';
import { ResolvedFicheEntities } from '../resolvers/resolve-entity.service';
import { isSousAction } from '../schemas/import-action.input';
import { importActionInputToUpdateFicheInput } from './import-action-input-to-update-fiche-input';
export function importPlanInputToCreatePlanAggregateInput(
  planImport: ImportPlanInput,
  resolvedEntities: ResolvedFicheEntities[],
  collectiviteId: number
): Result<CreatePlanAggregateInput, string> {
  const actionsWithPaths = planImport.actions.map((actionImport, index) => {
    const resolvedEntity = resolvedEntities[index];

    if (!resolvedEntity) {
      return failure(
        `No resolved entity found for action "${actionImport.titre}" (axisPath: ${
          actionImport.axisPath?.join(' > ') ?? 'none'
        })`
      );
    }

    if (isSousAction(actionImport)) {
      return success({
        axisPath: actionImport.axisPath,
        parentActionTitre: actionImport.parentActionTitre,
        fiche: importActionInputToUpdateFicheInput(
          actionImport,
          resolvedEntity
        ),
      });
    }

    return success({
      axisPath: actionImport.axisPath,
      fiche: importActionInputToUpdateFicheInput(
        actionImport,
        resolvedEntity
      ),
    });
  });
  const actionsWithPathsResults = combineResults(actionsWithPaths);
  if (!actionsWithPathsResults.success) {
    return failure(actionsWithPathsResults.error);
  }

  const planCreationRequest: CreatePlanAggregateInput = {
    collectiviteId,
    nom: planImport.nom,
    typeId: planImport.typeId,
    pilotes: planImport.pilotes?.filter(isPersonneId),
    referents: planImport.referents?.filter(isPersonneId),
    fiches: actionsWithPathsResults.data,
  };

  return success(planCreationRequest);
}
