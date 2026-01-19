import { ResolvedFicheEntities } from '@tet/backend/plans/fiches/import/resolvers/entity-resolver.service';
import { CreatePlanAggregateInput } from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.types';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/shared/types/result';
import { isPersonneId } from '@tet/domain/collectivites';
import { isEqual } from 'es-toolkit';
import { PlanImport } from '../import-plan.input';
import { adaptFicheImportToUpdateFicheRequest } from './adapt-fiche-import-to-update-fiche-request';

/**
 * Adapter: PlanImport → PlanAggregateCreationRequest
 *
 * Transforms import-specific plan data to the generic plan creation request
 * expected by the PlanAggregateService.
 *
 * This adapter is responsible for:
 * - Mapping plan metadata (nom, typeId, pilotes, referents)
 * - Transforming each fiche using toFicheWithRelations
 * - Matching fiches with their resolved entities
 *
 * @param planImport - The imported plan data from Excel
 * @param resolvedEntities - The resolved entities for all fiches
 * @param collectiviteId - The collectivité ID
 * @returns A PlanAggregateCreationRequest ready for the domain service
 */
export function adaptImportToPlanCreation(
  planImport: PlanImport,
  resolvedEntities: ResolvedFicheEntities[],
  collectiviteId: number
): Result<CreatePlanAggregateInput, string> {
  const fichesWithPaths = planImport.fiches.map((ficheImport) => {
    const resolvedEntity = resolvedEntities.find(
      (entity) =>
        isEqual(entity.axisPath, ficheImport.axisPath)
    );

    if (!resolvedEntity) {
      return failure(
        `No resolved entity found for fiche "${ficheImport.titre}" (axisPath: ${ficheImport.axisPath?.join(' > ') ?? 'none'})`
      );
    }

    return success({
      axisPath: ficheImport.axisPath,
      fiche: adaptFicheImportToUpdateFicheRequest(ficheImport, resolvedEntity, collectiviteId),
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
