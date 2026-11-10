import { CreatePlanAggregateInput } from '../../create-plan-aggregate/create-plan-aggregate.types';
import {
  FicheWithRelationsAndAxisPath,
  ImportPlanHierarchy,
} from '../validators/import-plan-hierarchy.rules';
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
        `No resolved entity found for action "${
          actionImport.titre
        }" (axisPath: ${actionImport.axisPath?.join(' > ') ?? 'none'})`
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
        secteursProposes: actionImport.secteursProposes,
      });
    }

    return success({
      axisPath: actionImport.axisPath,
      fiche: importActionInputToUpdateFicheInput(actionImport, resolvedEntity),
      secteursProposes: actionImport.secteursProposes,
    });
  });
  const actionsWithPathsResults = combineResults(actionsWithPaths);
  if (!actionsWithPathsResults.success) {
    return failure(actionsWithPathsResults.error);
  }

  const fiches: FicheWithRelationsAndAxisPath[] = actionsWithPathsResults.data;
  const paths = fiches.flatMap(({ axisPath }) =>
    axisPath?.length ? [axisPath] : []
  );
  const validation = ImportPlanHierarchy.validate(planImport.nom, fiches);
  if (!validation.isValid) return failure(validation.errors.join(', '));

  const parentKeys = new Map(
    fiches.flatMap((fiche, index) =>
      fiche.parentActionTitre || !fiche.fiche.titre
        ? []
        : [
            [
              ImportPlanHierarchy.getActionKey(
                fiche.fiche.titre,
                fiche.axisPath
              ),
              `fiche-${index}`,
            ],
          ]
    )
  );
  const planCreationRequest: CreatePlanAggregateInput = {
    collectiviteId,
    nom: planImport.nom,
    typeId: planImport.typeId,
    dateDebut: planImport.dateDebut,
    dateFin: planImport.dateFin,
    pilotes: planImport.pilotes?.filter(isPersonneId),
    referents: planImport.referents?.filter(isPersonneId),
    axes: ImportPlanHierarchy.extractAxes(paths).map((axe) => ({
      sourceKey: axe.fullPath,
      parentSourceKey: axe.parentPath
        ? ImportPlanHierarchy.serializePath(axe.parentPath)
        : undefined,
      nom: axe.path[axe.path.length - 1],
    })),
    fiches: fiches.map(({ axisPath, parentActionTitre, ...fiche }, index) => ({
      ...fiche,
      sourceKey: `fiche-${index}`,
      axeSourceKey: axisPath?.length
        ? ImportPlanHierarchy.serializePath(axisPath)
        : undefined,
      parentSourceKey: parentActionTitre
        ? parentKeys.get(
            ImportPlanHierarchy.getActionKey(parentActionTitre, axisPath)
          )
        : undefined,
    })),
  };

  return success(planCreationRequest);
}
