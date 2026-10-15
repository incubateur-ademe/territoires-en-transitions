import { appLabels } from '@/app/labels/catalog';
import type {
  ChartTooltipBadge,
  ChartTooltipContent,
} from '@/app/ui/charts/chart-tooltip';
import { Pertinence } from '@tet/domain/collectivites';
import { CategorieAction } from '@tet/domain/shared';
import { LevierPlace, toQuadrant } from '../data/to-matrix-points';
import {
  MobilisationLevel,
  toMobilisationLabel,
  toMobilisationLevel,
  toMobilisationLevelOfScore,
  toMobilisationVariant,
} from './mobilisation-level';

type LevierTooltipContent = Required<ChartTooltipContent>;

const toMobilisationBadge = (level: MobilisationLevel): ChartTooltipBadge => ({
  label: toMobilisationLabel(level),
  variant: toMobilisationVariant(level),
});

const toHint = (pertinence?: Pertinence): string =>
  pertinence === 'non_pertinent'
    ? appLabels.levierNonPertinentCliquerPourOuvrir
    : appLabels.cliquerPourVoirLesActions;

export const toLevierTooltip = ({
  nom,
  impactIndex,
  potentielScore,
  mobilisationScore,
  pertinence,
}: Pick<
  LevierPlace,
  'nom' | 'impactIndex' | 'potentielScore' | 'mobilisationScore' | 'pertinence'
>): LevierTooltipContent => ({
  title: nom,
  lines: [
    appLabels.levierQuadrantLecture[
      toQuadrant({ potentielScore, mobilisationScore })
    ],
    appLabels.impactPotentielEstime(impactIndex),
  ],
  badge: toMobilisationBadge(toMobilisationLevelOfScore(mobilisationScore)),
  hint: toHint(pertinence),
});

export const toCategorieTooltip = ({
  levierNom,
  categorie,
  impactIndex,
  note,
  pertinence,
}: {
  levierNom: string;
  categorie: CategorieAction;
  impactIndex: number;
  note: number;
  pertinence?: Pertinence;
}): LevierTooltipContent => ({
  title: appLabels.sousLevierLabel({ levierNom, categorie }),
  lines: [appLabels.impactPotentielEstime(impactIndex)],
  badge: toMobilisationBadge(toMobilisationLevel(note)),
  hint: toHint(pertinence),
});
