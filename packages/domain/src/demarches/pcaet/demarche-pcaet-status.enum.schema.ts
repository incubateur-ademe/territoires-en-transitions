import * as z from 'zod/mini';

/**
 * Cycle de vie d'un dépôt PCAET, aligné sur la timeline affichée dans l'app :
 * Élaboration → Transmis pour avis → Adopté et en cours de mise en œuvre →
 * Archivé. La visibilité grand public (brouillon/publié) est portée par le
 * statut de publication, indépendant de ce cycle.
 */
export const DemarchePcaetStatusEnum = {
  EN_ELABORATION: 'en_elaboration',
  TRANSMIS_POUR_AVIS: 'transmis_pour_avis',
  ADOPTE: 'adopte',
  ARCHIVE: 'archive',
} as const;

export const demarchePcaetStatusValues = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  DemarchePcaetStatusEnum.ADOPTE,
  DemarchePcaetStatusEnum.ARCHIVE,
] as const;

export const demarchePcaetStatusSchema = z.enum(demarchePcaetStatusValues);

export type DemarchePcaetStatus = z.infer<typeof demarchePcaetStatusSchema>;
