import * as z from 'zod/mini';
import { demarcheDocumentsConfigSchema } from './demarche-definition.schema';

/**
 * Étape du cycle de vie à laquelle une pièce est attendue :
 * - `amont` : constitue le dossier d'élaboration, exigée pour la transmission ;
 * - `aval` : produite après les avis (ex. délibération d'adoption), exigée
 *   pour la publication.
 */
export const demarcheDocumentEtapeValues = ['amont', 'aval'] as const;

export const demarcheDocumentEtapeSchema = z.enum(demarcheDocumentEtapeValues);

export type DemarcheDocumentEtape = z.infer<typeof demarcheDocumentEtapeSchema>;

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
  etape: demarcheDocumentEtapeSchema,
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
