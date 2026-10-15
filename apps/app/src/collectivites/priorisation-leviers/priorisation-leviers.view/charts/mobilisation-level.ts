import { appLabels } from '@/app/labels/catalog';
import type { IntensityVariant } from '@/app/ui/charts/treemap/treemap-group';
import { MATRIX_SCALE } from '../data/to-matrix-points';

export const MOBILISATION_SCALE = ['none', 'partial', 'good', 'full'] as const;

export type MobilisationLevel = (typeof MOBILISATION_SCALE)[number];

const LABEL_BY_MOBILISATION_LEVEL: Record<MobilisationLevel, string> = {
  none: appLabels.mobilisationNulle,
  partial: appLabels.mobilisationFaible,
  good: appLabels.mobilisationMoyenne,
  full: appLabels.mobilisationForte,
};

export const toMobilisationLevel = (note: number): MobilisationLevel =>
  MOBILISATION_SCALE.at(note) ?? 'none';

export const toMobilisationLevelOfScore = (
  mobilisationScore: number
): MobilisationLevel =>
  toMobilisationLevel(
    Math.round(
      (mobilisationScore / MATRIX_SCALE) * (MOBILISATION_SCALE.length - 1)
    )
  );

const VARIANT_BY_MOBILISATION_LEVEL: Record<
  MobilisationLevel,
  IntensityVariant
> = {
  none: 'grey',
  partial: 'warning',
  good: 'success',
  full: 'success',
};

export const toMobilisationVariant = (
  level: MobilisationLevel
): IntensityVariant => VARIANT_BY_MOBILISATION_LEVEL[level];

export const toMobilisationLabel = (level: MobilisationLevel): string =>
  LABEL_BY_MOBILISATION_LEVEL[level];
