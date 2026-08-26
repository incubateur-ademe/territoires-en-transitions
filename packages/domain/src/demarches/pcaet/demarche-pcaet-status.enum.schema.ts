import * as z from 'zod/mini';

/**
 * Cycle de vie d'un dépôt PCAET, linéaire : Élaboration → Transmis pour avis →
 * Instruit → Publié → Archivé.
 *
 * `instruit` est le seul statut que la collectivité n'atteint pas elle-même :
 * le dossier y basculle quand les avis attendus sont rendus, ou quand le délai
 * légal est échu (cf. les transitions système du workflow). C'est là que se
 * finalise le dépôt — les pièces aval s'y déposent.
 *
 * L'adoption et la mise à disposition du public sont un seul acte : `publier`
 * vaut adoption, et exige la délibération d'adoption.
 */
export const DemarchePcaetStatusEnum = {
  EN_ELABORATION: 'en_elaboration',
  TRANSMIS_POUR_AVIS: 'transmis_pour_avis',
  INSTRUIT: 'instruit',
  PUBLIE: 'publie',
  ARCHIVE: 'archive',
} as const;

export const demarchePcaetStatusValues = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  DemarchePcaetStatusEnum.INSTRUIT,
  DemarchePcaetStatusEnum.PUBLIE,
  DemarchePcaetStatusEnum.ARCHIVE,
] as const;

export const demarchePcaetStatusSchema = z.enum(demarchePcaetStatusValues);

export type DemarchePcaetStatus = z.infer<typeof demarchePcaetStatusSchema>;
