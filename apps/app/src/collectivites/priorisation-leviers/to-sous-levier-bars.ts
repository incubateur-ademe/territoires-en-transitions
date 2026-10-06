import { appLabels } from '@/app/labels/catalog';
import type { StatusBar } from '@/app/ui/charts/status-bar/status-bar';
import { LevierId } from '@tet/domain/shared';
import { toMobilisationLabel, toMobilisationLevel } from './mobilisation-level';
import { LevierPlace } from './to-matrix-points';
import { toMondrianTiles } from './to-mondrian-tiles';

export type SousLevierBar = StatusBar<string> & { levierId: LevierId };

export const toSousLevierBars = (places: LevierPlace[]): SousLevierBar[] =>
  toMondrianTiles(places)
    .flatMap((levier) =>
      levier.categories.map((categorie) => ({
        id: `${levier.levierId}/${categorie.categorie}`,
        label: `${levier.nom} · ${appLabels.categorieActionLabel(
          categorie.categorie
        )}`,
        value: categorie.potentielReduction,
        status: toMobilisationLabel(toMobilisationLevel(categorie.note)),
        levierId: levier.levierId,
      }))
    )
    .sort((first, second) => second.value - first.value);
