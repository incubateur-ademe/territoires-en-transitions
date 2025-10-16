import { PlanImport } from '@/backend/plans/fiches/import/import-plan.dto';
import { ResolvedFicheEntities } from '@/backend/plans/fiches/import/resolvers/entity-resolver.service';
import { PlanAggregateCreationRequest } from '@/backend/plans/plans/types/plan-aggregate-creation.types';
import { failure, Result, success } from '@/backend/shared/types/result';
import { isEqual } from 'es-toolkit';
import { toFicheWithRelations } from './fiche-with-relations.adapter';

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
 * This is a pure function with no side effects, making it easily testable.
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
): Result<PlanAggregateCreationRequest, string> {
  try {
    const fichesWithPaths = planImport.fiches.map((ficheImport) => {
      // Find the resolved entities for this fiche by matching axis paths
      const resolvedEntity = resolvedEntities.find((e) =>
        isEqual(e.axisPath, ficheImport.axisPath)
      );

      if (!resolvedEntity) {
        throw new Error(
          `No resolved entities found for fiche: ${
            ficheImport.titre
          } (axis path: ${ficheImport.axisPath.join(' > ')})`
        );
      }

      return {
        axisPath: ficheImport.axisPath,
        fiche: toFicheWithRelations(
          ficheImport,
          resolvedEntity,
          collectiviteId
        ),
      };
    });

    return success({
      collectiviteId,
      nom: planImport.nom,
      typeId: planImport.typeId,
      pilotes: planImport.pilotes,
      referents: planImport.referents,
      fiches: fichesWithPaths,
    });
  } catch (error) {
    return failure(
      `Error adapting import to plan creation: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
