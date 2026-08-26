import * as z from 'zod/mini';
import { demarcheDocumentsConfigSchema } from './demarche-definition.schema';

/**
 * Les deux temps du dossier. Une pièce y est **déposée** à l'un ou à l'autre,
 * jamais aux deux à la fois — c'est ce qui permet aux deux versions d'une même
 * pièce de coexister.
 */
export const demarcheDocumentEtapeValues = ['amont', 'aval'] as const;

export const demarcheDocumentEtapeSchema = z.enum(demarcheDocumentEtapeValues);

export type DemarcheDocumentEtape = z.infer<typeof demarcheDocumentEtapeSchema>;

/**
 * Portée d'une pièce du catalogue — à quel(s) temps du dossier elle appartient :
 * - `amont` : constitue le dossier d'élaboration, exigée pour la transmission ;
 * - `aval` : produite après les avis (ex. délibération d'adoption), exigée
 *   pour la publication ;
 * - `both` : attendue à l'amont, et **révisable** à l'aval — le diagnostic ou la
 *   stratégie qu'un avis avec réserves conduit à reprendre. Les deux versions
 *   sont conservées : l'instruction porte sur celle qui a été transmise.
 *
 * `both` n'exige rien de plus pour publier : la pièce est requise à l'amont, sa
 * reprise reste facultative.
 */
export const demarcheDocumentPorteeValues = ['amont', 'aval', 'both'] as const;

export const demarcheDocumentPorteeSchema = z.enum(
  demarcheDocumentPorteeValues
);

export type DemarcheDocumentPortee = z.infer<
  typeof demarcheDocumentPorteeSchema
>;

/** La pièce appartient-elle à ce temps du dossier ? */
export const isDemarcheDocumentDeEtape = (
  portee: DemarcheDocumentPortee,
  etape: DemarcheDocumentEtape
): boolean => portee === etape || portee === 'both';

/**
 * Le temps du dossier où la pièce est **exigée**. Une pièce de portée `both`
 * l'est à l'amont : sa version aval est une reprise, elle ne conditionne pas la
 * publication.
 */
export const getEtapeExigeanteDemarcheDocument = (
  portee: DemarcheDocumentPortee
): DemarcheDocumentEtape => (portee === 'aval' ? 'aval' : 'amont');

/**
 * Une pièce attendue telle que définie par le modèle de démarche (en base, pas
 * dans le code applicatif).
 */
export const demarcheDocumentDefinitionSchema = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string(),
  /** Une pièce requise doit être couverte pour que l'étape Documents soit complète. */
  requis: z.boolean(),
  ordre: z.number(),
  /** Temps du dossier auquel la pièce appartient — `both` incluse. */
  etape: demarcheDocumentPorteeSchema,
  /** Identifiants des pièces dont le dépôt couvre celle-ci d'office (ex. document global). */
  substituts: z.array(z.string()),
  /**
   * Identifiants des pièces dans lesquelles celle-ci *peut* être comprise, sans
   * l'être d'office : la collectivité déclare l'inclusion, pièce par pièce.
   * Toutes les pièces attendues ne se retrouvent pas dans un document global —
   * une étude d'impact ou une délibération vivent souvent à part.
   */
  substitutsDeclarables: z.array(z.string()),
});

export type DemarcheDocumentDefinition = z.infer<
  typeof demarcheDocumentDefinitionSchema
>;

/** Fichier de la bibliothèque de la collectivité rattaché à une pièce. */
export const demarcheDocumentFichierSchema = z.object({
  id: z.number(),
  filename: z.string(),
  hash: z.string(),
  bucketId: z.nullable(z.string()),
  filesize: z.nullable(z.number()),
});

export type DemarcheDocumentFichier = z.infer<
  typeof demarcheDocumentFichierSchema
>;

/**
 * Pièce satisfaite pour une démarche : soit par un fichier déposé, soit — quand
 * `fichier` est nul — par l'inclusion que la collectivité a déclarée dans une
 * autre pièce du dossier.
 */
export const demarcheDocumentDeposeSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  /**
   * Temps du dossier où cette version a été déposée. Une pièce de portée `both`
   * en a donc jusqu'à deux, et la version amont n'est jamais écrasée.
   */
  etape: demarcheDocumentEtapeSchema,
  commentaire: z.string(),
  modifiedAt: z.string(),
  modifiedBy: z.nullable(z.string()),
  fichier: z.nullable(demarcheDocumentFichierSchema),
});

export type DemarcheDocumentDepose = z.infer<
  typeof demarcheDocumentDeposeSchema
>;

/**
 * Pièce additionnelle par la collectivité, hors catalogue. Son titre est sa
 * seule identité — il est saisi avant le dépôt, `fichier` est donc nul tant que
 * le fichier n'est pas arrivé. Toujours optionnelle : elle ne pèse ni sur la
 * transmission ni sur la publication.
 */
export const DEMARCHE_DOCUMENT_ADDITIONAL_TITRE_MAX = 300;

export const demarcheDocumentAdditionalSchema = z.object({
  id: z.number(),
  etape: demarcheDocumentEtapeSchema,
  titre: z.string(),
  commentaire: z.string(),
  modifiedAt: z.string(),
  modifiedBy: z.nullable(z.string()),
  fichier: z.nullable(demarcheDocumentFichierSchema),
});

export type DemarcheDocumentAdditional = z.infer<
  typeof demarcheDocumentAdditionalSchema
>;

/**
 * État complet des documents d'une démarche : ce que le type autorise, le modèle
 * attendu, ce qui a été déposé et les pièces additionnelles. Consommé tel
 * quel par le front (affichage) et par le backend (guard `dossierComplet`), pour
 * que la règle de couverture ne puisse pas diverger.
 */
export const demarcheDocumentsSnapshotSchema = z.object({
  config: demarcheDocumentsConfigSchema,
  definitions: z.array(demarcheDocumentDefinitionSchema),
  documents: z.array(demarcheDocumentDeposeSchema),
  documentsAdditional: z.array(demarcheDocumentAdditionalSchema),
});

export type DemarcheDocumentsSnapshot = z.infer<
  typeof demarcheDocumentsSnapshotSchema
>;
