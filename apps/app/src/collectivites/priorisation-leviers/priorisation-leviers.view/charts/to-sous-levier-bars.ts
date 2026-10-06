import { appLabels } from '@/app/labels/catalog';
import type { StatusBar } from '@/app/ui/charts/status-bar/status-bar';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import { toMobilisationLabel, toMobilisationLevel } from './mobilisation-level';
import { LevierPlace } from './to-matrix-points';
import { toMondrianTiles } from './to-mondrian-tiles';

export type SousLevierId = `${LevierId}/${CategorieAction}`;

export type SousLevierBar = StatusBar<string> & {
  id: SousLevierId;
  levierId: LevierId;
  categorie: CategorieAction;
};

export const toSousLevierBars = (places: LevierPlace[]): SousLevierBar[] =>
  toMondrianTiles(places)
    .flatMap((levierTile) =>
      levierTile.categories.map((categorieTile) => ({
        id: `${levierTile.levierId}/${categorieTile.categorie}` as const,
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
