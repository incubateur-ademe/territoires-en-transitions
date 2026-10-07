import * as z from 'zod/mini';

/**
 * Cycle de vie d'un dépôt PCAET : Élaboration → Transmis pour avis → Instruit →
 * Publié → Archivé.
 *
 * `instruit` est le seul statut que la collectivité n'atteint pas elle-même :
 * le dossier y bascule quand les avis attendus sont rendus, ou quand le délai
 * légal est échu (cf. les transitions système du workflow). C'est là que se
 * finalise le dépôt — les pièces aval s'y déposent.
 *
 * `instruit_hors_plateforme` est l'autre entrée de cette même étape de
 * finalisation, pour les collectivités dont le PCAET a été transmis et instruit
 * **hors de la plateforme**. Le dossier y démarre, sans être jamais passé par
 * l'élaboration ni la transmission : le circuit d'avis ne s'ouvre donc jamais
 * pour lui. Ce qu'il ne dispense pas de faire : les pièces amont y restent
 * exigées, et modifiables, jusqu'à la publication.
 *
 * Le cycle n'est donc plus une ligne mais un Y : deux entrées dans la
 * finalisation, une seule suite. Il reste sans retour en arrière.
 *
 * L'adoption et la mise à disposition du public sont un seul acte : `publier`
 * vaut adoption, et exige la délibération d'adoption.
 */
export const DemarchePcaetStatusEnum = {
  EN_ELABORATION: 'en_elaboration',
  TRANSMIS_POUR_AVIS: 'transmis_pour_avis',
  INSTRUIT: 'instruit',
  INSTRUIT_HORS_PLATEFORME: 'instruit_hors_plateforme',
  PUBLIE: 'publie',
  ARCHIVE: 'archive',
} as const;

export const demarchePcaetStatusValues = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  DemarchePcaetStatusEnum.INSTRUIT,
  DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME,
  DemarchePcaetStatusEnum.PUBLIE,
  DemarchePcaetStatusEnum.ARCHIVE,
] as const;

export const demarchePcaetStatusSchema = z.enum(demarchePcaetStatusValues);

export type DemarchePcaetStatus = z.infer<typeof demarchePcaetStatusSchema>;
