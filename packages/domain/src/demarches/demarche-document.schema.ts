import * as z from 'zod/mini';

/**
 * Portée d'une pièce attendue au dépôt :
 * - `global` : document unique regroupant l'ensemble du dossier ;
 * - `section` : pièce listée dans le « Détail par section attendue ».
 */
export const demarcheDocumentPorteeValues = ['global', 'section'] as const;

export const demarcheDocumentPorteeSchema = z.enum(demarcheDocumentPorteeValues);

export type DemarcheDocumentPortee = z.infer<typeof demarcheDocumentPorteeSchema>;

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

export type DemarcheDocumentFichier = z.infer<typeof demarcheDocumentFichierSchema>;

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

export type DemarcheDocumentDepose = z.infer<typeof demarcheDocumentDeposeSchema>;

/**
 * État complet des documents d'une démarche : le modèle attendu et ce qui a été
 * déposé. Consommé tel quel par le front (affichage) et par le backend (guard
 * `dossierComplet`), pour que la règle de couverture ne puisse pas diverger.
 */
export const demarcheDocumentsSnapshotSchema = z.object({
  definitions: z.array(demarcheDocumentDefinitionSchema),
  documents: z.array(demarcheDocumentDeposeSchema),
});

export type DemarcheDocumentsSnapshot = z.infer<
  typeof demarcheDocumentsSnapshotSchema
>;
