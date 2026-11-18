import {
  CategorieAction,
  categorieActionEnumValues,
  Levier,
  LEVIER_NOM_BY_ID,
} from '@tet/domain/shared';
import { uniq } from 'es-toolkit';
import {
  FicheClassification,
  MAX_LEVIERS_PER_FICHE,
} from './classify-fiche.schema';
import { RenderedFiche } from './render-fiche-text';

export type ClassifiedVolet = {
  levier: Levier;
  categorie: CategorieAction;
};

export type ClassifiedFiche = {
  ficheId: number;
  isDescriptionTruncated: boolean;
  volets: ClassifiedVolet[];
};

export const toClassifiedFiche = (
  classification: FicheClassification,
  { ficheId, isDescriptionTruncated }: Pick<
    RenderedFiche,
    'ficheId' | 'isDescriptionTruncated'
  >
): ClassifiedFiche => {
  const retainedLevierIds = uniq(
    classification.leviers.map(({ levier }) => levier)
  ).slice(0, MAX_LEVIERS_PER_FICHE);

  return {
    ficheId,
    isDescriptionTruncated,
    volets: retainedLevierIds.flatMap((levierId) =>
      uniq(
        classification.leviers
          .filter(({ levier }) => levier === levierId)
          .flatMap(({ categories }) => categories)
      ).map((rank) => ({
        levier: LEVIER_NOM_BY_ID[levierId],
        categorie: categorieActionEnumValues[rank - 1],
      }))
    ),
  };
};
