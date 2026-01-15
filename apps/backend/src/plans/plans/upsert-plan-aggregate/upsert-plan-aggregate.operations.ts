/**
 * Plan Domain Operations
 *
 * Opérations métier pures pour le domaine Plan.
 * Ces fonctions sont pures (sans side effects) et testables unitairement.
 * Elles ne dépendent d'aucun service externe, base de données ou framework.
 */

import { failure, Result, success } from '@tet/backend/shared/types/result';
import { uniq } from 'es-toolkit';
import {
  PlanAggregateError,
  PlanAggregateErrorType,
} from './upsert-plan-aggregate.errors';
import {
  AxeHierarchyValidation,
  AxisPath,
  PlanAggregateValidation,
  PlanCreationData,
  PlanCreationDataSchema,
  UniqueAxe,
} from './upsert-plan-aggregate.types';

const JOIN_CHAR = '::';
export const axisFormatter = {
  serialize: (path: AxisPath) => path.join(JOIN_CHAR),
  deserialize: (key: string) => key.split(JOIN_CHAR) as AxisPath,
};

export function validatePlanCreationData(
  data: unknown
):
  | { valid: true; data: PlanCreationData }
  | { valid: false; error: PlanAggregateErrorType; cause: string } {
  const result = PlanCreationDataSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      valid: false,
      error: PlanAggregateError.INVALID_PLAN_DATA,
      cause: firstError.message,
    };
  }

  return { valid: true, data: result.data };
}

/**
 * Extrait tous les axes uniques depuis une liste de chemins, triés par profondeur
 * @returns Liste d'axes uniques avec leurs métadonnées
 */
export function extractUniqueAxes(paths: AxisPath[]): UniqueAxe[] {
  const uniquePathsSet = paths.reduce((acc, path) => {
    for (let i = 1; i <= path.length; i++) {
      const subPath = path.slice(0, i);
      acc.add(axisFormatter.serialize(subPath));
    }
    return acc;
  }, new Set<string>());

  return Array.from(uniquePathsSet)
    .map((fullPath) => {
      const path = axisFormatter.deserialize(fullPath);
      return {
        path,
        fullPath,
        depth: path.length,
        parentPath: path.length > 1 ? path.slice(0, -1) : undefined,
      };
    })
    .sort((a, b) => a.depth - b.depth);
}

/**
 * Valide la hiérarchie d'axes (tous les parents existent)
 */
function validateAxeHierarchy(paths: AxisPath[]): AxeHierarchyValidation {
  const uniqueAxes = extractUniqueAxes(paths);
  const existingPaths = new Set(uniqueAxes.map((a) => a.fullPath));

  const missingParents: string[][] = [];
  const orphanedPaths: string[][] = [];

  // Vérifier que tous les parents existent
  for (const axe of uniqueAxes) {
    if (axe.parentPath) {
      const parentFullPath = axisFormatter.serialize(axe.parentPath);
      if (!existingPaths.has(parentFullPath)) {
        missingParents.push(axe.parentPath);
        orphanedPaths.push(axe.path);
      }
    }
  }

  const isValid = missingParents.length === 0;

  return {
    isValid,
    missingParents: uniq(missingParents),
    orphanedPaths,
  };
}

export function validatePlanAggregate(
  planData: PlanCreationData,
  ficheAxisPaths: AxisPath[]
): PlanAggregateValidation {
  const errors: string[] = [];

  const nameError = planData.nom.length === 0;
  if (nameError) {
    errors.push('Le nom du plan ne peut pas être vide');
  }

  const hierarchyValidation = validateAxeHierarchy(ficheAxisPaths);
  if (!hierarchyValidation.isValid) {
    errors.push(
      `Axes parents manquants : ${hierarchyValidation.missingParents
        .map((p) => p.join(' > '))
        .join(', ')}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Trouve l'ID d'un axe parent depuis une map de chemins
 * @returns Result avec l'ID du parent ou une erreur
 */
export function findParentAxeId(
  childPath: AxisPath,
  axePathMap: Map<string, number>,
  planId: number
): Result<number, PlanAggregateErrorType> {
  const firstLevelAxe = childPath.length === 1;
  if (firstLevelAxe) {
    return success(planId);
  }

  const parentPath = childPath.slice(0, -1);
  const parentId = axePathMap.get(axisFormatter.serialize(parentPath));

  if (parentId === undefined) {
    return failure(PlanAggregateError.INVALID_AXE_HIERARCHY);
  }

  return success(parentId);
}
