import { CategorieAction } from '@tet/domain/shared';
import {
  MAX_TITRE_LENGTH,
  sanitize,
  truncate,
} from '../classify-fiches/render-fiches-text';
import {
  CATEGORIES_IN_PROMPT_ORDER,
  CATEGORIE_LABELS,
  toCategorieRank,
} from './volet-categories';

export const MAX_MOBILISATION_DESCRIPTION_LENGTH = 600;

export const EMPTY_CATEGORIE_TEXT = '(aucune action)';

export type FicheToScore = {
  ficheId: number;
  titre: string;
  description: string | null;
};

const renderFiche = ({ ficheId, titre, description }: FicheToScore): string => {
  const renderedTitre = truncate(sanitize(titre), MAX_TITRE_LENGTH);
  const renderedDescription = truncate(
    sanitize(description ?? ''),
    MAX_MOBILISATION_DESCRIPTION_LENGTH
  );

  return renderedDescription.length > 0
    ? `${ficheId} | ${renderedTitre} : ${renderedDescription}`
    : `${ficheId} | ${renderedTitre}`;
};

export const renderVoletActions = ({
  ficheIdsByCategorie,
  fichesById,
}: {
  ficheIdsByCategorie: Record<CategorieAction, number[]>;
  fichesById: Map<number, FicheToScore>;
}): string =>
  CATEGORIES_IN_PROMPT_ORDER.flatMap((categorie) => {
    const fiches = ficheIdsByCategorie[categorie]
      .map((ficheId) => fichesById.get(ficheId))
      .filter((fiche): fiche is FicheToScore => fiche !== undefined);

    return [
      `Catégorie ${toCategorieRank(categorie)} — ${
        CATEGORIE_LABELS[categorie]
      } :`,
      fiches.length > 0
        ? fiches.map(renderFiche).join('\n\n')
        : EMPTY_CATEGORIE_TEXT,
      '',
    ];
  })
    .join('\n')
    .trim();
