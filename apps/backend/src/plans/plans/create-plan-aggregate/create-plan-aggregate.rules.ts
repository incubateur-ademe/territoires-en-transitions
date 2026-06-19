/**
 * Plan Domain Operations
 *
 * Opérations métier pures pour le domaine Plan.
 * Ces fonctions sont pures (sans side effects) et testables unitairement.
 * Elles ne dépendent d'aucun service externe, base de données ou framework.
 */

import { failure, Result, success } from '@tet/backend/utils/result.type';
import { uniq } from 'es-toolkit';
import {
  CreatePlanAggregateError,
  CreatePlanAggregateErrorType,
} from './create-plan-aggregate.errors';
import {
  AxeHierarchyValidation,
  AxisPath,
  CreatePlanAggregateValidation,
  FicheWithRelationsAndAxisPath,
  isSousAction,
  PlanCreationData,
  PlanCreationDataSchema,
  UniqueAxe,
} from './create-plan-aggregate.types';

const JOIN_CHAR = '::';
export const axisFormatter = {
  serialize: (path: AxisPath) => path.join(JOIN_CHAR),
  deserialize: (key: string): AxisPath => key.split(JOIN_CHAR),
};

/**
 * Builds a unique key for an action within its axis context.
 * Used to identify, deduplicate, and link actions/sous-actions.
 */
export const getActionKey = (titre: string, axisPath?: string[]): string =>
  axisFormatter.serialize([...(axisPath ?? []), titre]);

export function validatePlanCreationData(
  data: unknown
):
  | { valid: true; data: PlanCreationData }
  | { valid: false; error: CreatePlanAggregateErrorType; cause: string } {
  const result = PlanCreationDataSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      valid: false,
      error: CreatePlanAggregateError.INVALID_PLAN_DATA,
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
  ficheAxisPaths: AxisPath[],
  fiches: FicheWithRelationsAndAxisPath[]
): CreatePlanAggregateValidation {
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

  const orphanedSousActions = findOrphanedSousActions(fiches);
  if (orphanedSousActions.length > 0) {
    errors.push(
      `Sous-actions sans action parente : ${orphanedSousActions.join(', ')}`
    );
  }

  const duplicateKeys = findDuplicateActionKeys(fiches);
  if (duplicateKeys.length > 0) {
    errors.push(
      `Titres d'actions en doublon dans le même axe : ${duplicateKeys.join(
        ', '
      )}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function findOrphanedSousActions(
  fiches: FicheWithRelationsAndAxisPath[]
): string[] {
  const ficheActionKeys = new Set(
    fiches
      .filter(({ parentActionTitre }) => !parentActionTitre)
      .flatMap(({ fiche, axisPath }) =>
        fiche.titre ? [getActionKey(fiche.titre, axisPath)] : []
      )
  );

  const sousActions = fiches
    .filter(isSousAction)
    .filter(
      (f) => !ficheActionKeys.has(getActionKey(f.parentActionTitre, f.axisPath))
    );
  return sousActions.map(
    (f) => `"${f.fiche.titre}" (action parente: "${f.parentActionTitre}")`
  );
}

function findDuplicateActionKeys(
  fiches: FicheWithRelationsAndAxisPath[]
): string[] {
  const seen = fiches
    .filter(({ parentActionTitre }) => !parentActionTitre)
    .reduce((acc, { fiche, axisPath }) => {
      const { titre } = fiche;
      if (titre) {
        const key = getActionKey(titre, axisPath);
        acc.set(key, (acc.get(key) ?? 0) + 1);
      }
      return acc;
    }, new Map<string, number>());
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

/**
 * Trouve l'ID d'un axe parent depuis une map de chemins
 * @returns Result avec l'ID du parent ou une erreur
 */
export function findParentAxeId(
  childPath: AxisPath,
  axePathMap: Map<string, number>,
  planId: number
): Result<number, CreatePlanAggregateErrorType> {
  const firstLevelAxe = childPath.length === 1;
  if (firstLevelAxe) {
    return success(planId);
  }

  const parentPath = childPath.slice(0, -1);
  const parentId = axePathMap.get(axisFormatter.serialize(parentPath));

  if (parentId === undefined) {
    return failure(CreatePlanAggregateError.INVALID_AXE_HIERARCHY);
  }

  return success(parentId);
}
