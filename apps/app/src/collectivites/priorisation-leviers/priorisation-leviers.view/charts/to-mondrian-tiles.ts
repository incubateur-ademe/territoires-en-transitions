import {
  CategorieAction,
  categorieActionEnumValues,
  POTENTIEL_SHARE_BY_LEVIER,
} from '@tet/domain/shared';
import { pick } from 'es-toolkit';
import { LevierPlace } from './to-matrix-points';

export type CategorieTile = {
  categorie: CategorieAction;
  potentielReduction: number;
  note: number;
};

export type LevierTile = Pick<
  LevierPlace,
  'levierId' | 'nom' | 'pertinence' | 'potentielReduction'
> & {
  categories: CategorieTile[];
};

const toCategorieTiles = (levier: LevierPlace): CategorieTile[] => {
  const shareByCategorie = POTENTIEL_SHARE_BY_LEVIER[levier.levierId];
  return categorieActionEnumValues
    .filter((categorie) => shareByCategorie[categorie] > 0)
    .map((categorie) => ({
      categorie,
      potentielReduction:
        levier.potentielReduction * shareByCategorie[categorie],
      note: levier.noteByCategorie[categorie],
    }));
};

export const toMondrianTiles = (places: LevierPlace[]): LevierTile[] =>
  places
    .filter(({ potentielReduction }) => potentielReduction > 0)
    .map((levier) => ({
      ...pick(levier, ['levierId', 'nom', 'pertinence', 'potentielReduction']),
      categories: toCategorieTiles(levier),
    }));
