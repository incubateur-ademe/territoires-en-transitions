import * as z from 'zod/mini';

/**
 * Cycle de vie d'un dépôt PCAET, linéaire : Élaboration → Transmis pour avis →
 * Adopté → Publié → Archivé.
 *
 * La mise à disposition du public est une étape du cycle, et non une dimension
 * parallèle : on ne publie qu'un dossier adopté, et on n'archive qu'un dossier
 * publié.
 */
export const DemarchePcaetStatusEnum = {
  EN_ELABORATION: 'en_elaboration',
  TRANSMIS_POUR_AVIS: 'transmis_pour_avis',
  ADOPTE: 'adopte',
  PUBLIE: 'publie',
  ARCHIVE: 'archive',
} as const;

export const demarchePcaetStatusValues = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  DemarchePcaetStatusEnum.ADOPTE,
  DemarchePcaetStatusEnum.PUBLIE,
  DemarchePcaetStatusEnum.ARCHIVE,
] as const;

export const demarchePcaetStatusSchema = z.enum(demarchePcaetStatusValues);

export type DemarchePcaetStatus = z.infer<typeof demarchePcaetStatusSchema>;
