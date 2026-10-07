import { appLabels } from '@/app/labels/catalog';
import type { StatusBar } from '@/app/ui/charts/status-bar/status-bar';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import { LevierPlace } from '../data/to-matrix-points';
import { toMobilisationLabel, toMobilisationLevel } from './mobilisation-level';
import { toMondrianTiles } from './to-mondrian-tiles';

type SousLevierId = `${LevierId}/${CategorieAction}`;

type SousLevierBar = StatusBar<string> & {
  id: SousLevierId;
  levierId: LevierId;
  categorie: CategorieAction;
};

const toSousLevierId = (
  levierId: LevierId,
  categorie: CategorieAction
): SousLevierId => `${levierId}/${categorie}`;

export const toSousLevierBars = (places: LevierPlace[]): SousLevierBar[] =>
  toMondrianTiles(places)
    .flatMap((levierTile) =>
      levierTile.categories.map((categorieTile) => ({
        id: toSousLevierId(levierTile.levierId, categorieTile.categorie),
        label: appLabels.sousLevierLabel({
          levierNom: levierTile.nom,
          categorie: categorieTile.categorie,
        }),
        value: categorieTile.potentielReduction,
        status: toMobilisationLabel(toMobilisationLevel(categorieTile.note)),
        levierId: levierTile.levierId,
        categorie: categorieTile.categorie,
      }))
    )
    .sort((first, second) => second.value - first.value);
