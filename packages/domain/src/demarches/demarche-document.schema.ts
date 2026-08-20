import * as z from 'zod/mini';
import { demarcheDocumentsConfigSchema } from './demarche-definition.schema';

/**
 * Portée d'une pièce attendue au dépôt :
 * - `global` : document unique regroupant l'ensemble du dossier ;
 * - `section` : pièce listée dans le « Détail par section attendue ».
 */
export const demarcheDocumentPorteeValues = ['global', 'section'] as const;

export const demarcheDocumentPorteeSchema = z.enum(
  demarcheDocumentPorteeValues
);

export type DemarcheDocumentPortee = z.infer<
  typeof demarcheDocumentPorteeSchema
>;

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
 * Couverture d'une pièce attendue sans dépôt de document, par une
 * fonctionnalité de la plateforme.
 */
export const demarcheDocumentCouvertureSourceValues = ['plan_actions'] as const;

export const demarcheDocumentCouvertureSourceSchema = z.enum(
  demarcheDocumentCouvertureSourceValues
);

export type DemarcheDocumentCouvertureSource = z.infer<
  typeof demarcheDocumentCouvertureSourceSchema
>;

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
  portee: demarcheDocumentPorteeSchema,
  etape: demarcheDocumentEtapeSchema,
  /** Renseigné si la pièce peut être déclarée couverte sans document. */
  couverturePlateforme: z.nullable(demarcheDocumentCouvertureSourceSchema),
  /** Identifiants des pièces dont le dépôt couvre celle-ci (ex. document global). */
  substituts: z.array(z.string()),
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
 * `fichier` est nul — par la fonctionnalité déclarée dans sa définition
 * (`couverturePlateforme`).
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
