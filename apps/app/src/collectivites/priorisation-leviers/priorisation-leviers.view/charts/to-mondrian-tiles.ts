import {
  CategorieAction,
  categorieActionEnumValues,
  POTENTIEL_SHARE_BY_LEVIER,
} from '@tet/domain/shared';
import { pick } from 'es-toolkit';
import { LevierPlace } from '../data/to-matrix-points';
import { toSharesOf100 } from '../data/to-shares-of-100';

export type CategorieTile = {
  categorie: CategorieAction;
  potentielReduction: number;
  impactIndex: number;
  note: number;
};

export type LevierTile = Pick<
  LevierPlace,
  'levierId' | 'nom' | 'pertinence' | 'potentielReduction' | 'impactIndex'
> & {
  categories: CategorieTile[];
};

const toCategorieTiles = (levier: LevierPlace): CategorieTile[] => {
  const shareByCategorie = POTENTIEL_SHARE_BY_LEVIER[levier.levierId];
  const categories = categorieActionEnumValues.filter(
    (categorie) => shareByCategorie[categorie] > 0
  );
  const impactIndexes = toSharesOf100(
    categories.map((categorie) => shareByCategorie[categorie])
  );
  return categories.map((categorie, index) => ({
    categorie,
    potentielReduction: levier.potentielReduction * shareByCategorie[categorie],
    impactIndex: impactIndexes[index],
    note: levier.noteByCategorie[categorie],
  }));
};

export const toMondrianTiles = (places: LevierPlace[]): LevierTile[] =>
  places
    .filter(({ potentielReduction }) => potentielReduction > 0)
    .map((levier) => ({
      ...pick(levier, [
        'levierId',
        'nom',
        'pertinence',
        'potentielReduction',
        'impactIndex',
      ]),
      categories: toCategorieTiles(levier),
    }));
