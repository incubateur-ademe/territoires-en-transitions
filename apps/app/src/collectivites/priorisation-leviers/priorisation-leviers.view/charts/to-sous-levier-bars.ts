import { appLabels } from '@/app/labels/catalog';
import type { StatusBar } from '@/app/ui/charts/status-bar/status-bar';
import {
  ActionDeReference,
  CategorieAction,
  LevierId,
} from '@tet/domain/shared';
import { LevierPlace } from '../data/to-matrix-points';
import { toMobilisationLabel, toMobilisationLevel } from './mobilisation-level';
import { toCategorieTooltip } from './to-levier-tooltip';
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

export const toSelectedSousLevierId = ({
  levierId,
  categorie,
}: {
  levierId?: LevierId;
  categorie?: CategorieAction;
}): SousLevierId | undefined => {
  if (levierId === undefined || categorie === undefined) {
    return undefined;
  }
  return toSousLevierId(levierId, categorie);
};

export const toSousLevierBars = (
  places: LevierPlace[],
  preselectedActions: readonly ActionDeReference[]
): SousLevierBar[] => {
  const preselectedIds = new Set(
    preselectedActions.flatMap(({ leviers, categories }) =>
      leviers.flatMap((levier) =>
        categories.map((categorie) => toSousLevierId(levier, categorie))
      )
    )
  );
  return toMondrianTiles(places)
    .flatMap((levierTile) =>
      levierTile.categories.map((categorieTile) => {
        const id = toSousLevierId(levierTile.levierId, categorieTile.categorie);
        return {
          id,
          label: appLabels.sousLevierLabel({
            levierNom: levierTile.nom,
            categorie: categorieTile.categorie,
          }),
          value: categorieTile.potentielReduction,
          displayedValue: categorieTile.impactIndex,
          tooltip: toCategorieTooltip({
            levierNom: levierTile.nom,
            categorie: categorieTile.categorie,
            impactIndex: categorieTile.impactIndex,
            note: categorieTile.note,
            pertinence: levierTile.pertinence,
          }),
          status: preselectedIds.has(id)
            ? appLabels.ajouteeALaPreselection
            : toMobilisationLabel(toMobilisationLevel(categorieTile.note)),
          levierId: levierTile.levierId,
          categorie: categorieTile.categorie,
        };
      })
    )
    .sort((first, second) => second.value - first.value);
};
