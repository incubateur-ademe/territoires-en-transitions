import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CategorieAction,
  Levier,
  LEVIER_SECTEURS,
  LevierSecteur,
} from '@tet/domain/shared';
import { uniqBy } from 'es-toolkit';
import { FicheClassification } from './classify-fiches.schema';
import { RenderedFiche } from './render-fiches-text';

export type ClassifiedVolet = {
  levier: Levier;
  secteur: LevierSecteur;
  categorie: CategorieAction;
};

export type ClassifiedFiche = {
  ficheId: number;
  justification: string;
  isDescriptionTruncated: boolean;
  volets: ClassifiedVolet[];
};

export type InconsistentResponse =
  | { kind: 'empty_response' }
  | { kind: 'unexpected_index'; index: number }
  | { kind: 'duplicate_index'; index: number }
  | { kind: 'missing_indexes'; indexes: number[] }
  | { kind: 'contradictory_abstention'; index: number }
  | { kind: 'undeclared_abstention'; index: number };

const toVolets = (classification: FicheClassification): ClassifiedVolet[] =>
  uniqBy(
    classification.volets.flatMap((volet) =>
      volet.categories.map((categorie) => ({
        levier: volet.levier,
        secteur: LEVIER_SECTEURS[volet.levier],
        categorie,
      }))
    ),
    ({ levier, categorie }) => `${levier}|${categorie}`
  );

const isContradictoryAbstention = (
  classification: FicheClassification
): boolean =>
  classification.hasNoRelevantLevier && classification.volets.length > 0;

const isUndeclaredAbstention = (classification: FicheClassification): boolean =>
  !classification.hasNoRelevantLevier && classification.volets.length === 0;

const findUnexpectedClassification = (
  classifications: FicheClassification[],
  expectedIndexes: Set<number>
): FicheClassification | undefined =>
  classifications.find(({ index }) => !expectedIndexes.has(index));

const findDuplicatedClassification = (
  classifications: FicheClassification[]
): FicheClassification | undefined =>
  classifications.find(
    (classification, position) =>
      classifications.findIndex(
        ({ index }) => index === classification.index
      ) !== position
  );

const findMissingIndexes = (
  classifications: FicheClassification[],
  expectedIndexes: Set<number>
): number[] => {
  const classified = new Set(classifications.map(({ index }) => index));
  return [...expectedIndexes].filter((index) => !classified.has(index));
};

const findInconsistency = (
  classifications: FicheClassification[],
  rendered: RenderedFiche[]
): InconsistentResponse | undefined => {
  if (classifications.length === 0) {
    return { kind: 'empty_response' };
  }

  const expectedIndexes = new Set(rendered.map(({ index }) => index));

  const unexpected = findUnexpectedClassification(
    classifications,
    expectedIndexes
  );
  if (unexpected) {
    return { kind: 'unexpected_index', index: unexpected.index };
  }

  const duplicated = findDuplicatedClassification(classifications);
  if (duplicated) {
    return { kind: 'duplicate_index', index: duplicated.index };
  }

  const contradictory = classifications.find(isContradictoryAbstention);
  if (contradictory) {
    return { kind: 'contradictory_abstention', index: contradictory.index };
  }

  const undeclared = classifications.find(isUndeclaredAbstention);
  if (undeclared) {
    return { kind: 'undeclared_abstention', index: undeclared.index };
  }

  const missingIndexes = findMissingIndexes(classifications, expectedIndexes);
  if (missingIndexes.length > 0) {
    return { kind: 'missing_indexes', indexes: missingIndexes };
  }

  return undefined;
};

export const applyClassification = (
  classifications: FicheClassification[],
  rendered: RenderedFiche[]
): Result<ClassifiedFiche[], InconsistentResponse> => {
  const inconsistency = findInconsistency(classifications, rendered);
  if (inconsistency) {
    return failure(inconsistency);
  }

  const classificationByIndex = new Map(
    classifications.map((classification) => [
      classification.index,
      classification,
    ])
  );

  return success(
    rendered.flatMap((fiche) => {
      const classification = classificationByIndex.get(fiche.index);
      if (!classification) {
        return [];
      }
      return [
        {
          ficheId: fiche.ficheId,
          justification: classification.justification,
          isDescriptionTruncated: fiche.isDescriptionTruncated,
          volets: toVolets(classification),
        },
      ];
    })
  );
};
