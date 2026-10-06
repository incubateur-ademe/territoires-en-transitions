import { appLabels } from '@/app/labels/catalog';

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

export const toMobilisationLabel = (level: MobilisationLevel): string =>
  LABEL_BY_MOBILISATION_LEVEL[level];
