export const DEFAULT_SEGMENTATION = 'autre';
export const ORDERED_SEGMENTATIONS = [
  'vecteur_filiere',
  'secteur',
  'vecteur',
  'filiere',
  DEFAULT_SEGMENTATION,
] as const;

export type IndicateurSegmentation = (typeof ORDERED_SEGMENTATIONS)[number];
