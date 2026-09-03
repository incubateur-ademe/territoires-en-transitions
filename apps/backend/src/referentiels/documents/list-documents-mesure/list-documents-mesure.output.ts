import z from 'zod';

const fichierSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  hash: z.string(),
  filename: z.string(),
  confidentiel: z.boolean().nullable(),
  bucketId: z.string(),
  filesize: z
    .number()
    .nullable()
    .transform((filesize) => filesize ?? undefined),
});

const lienSchema = z.object({
  url: z.string(),
  titre: z.string(),
});

const supportSchema = z.union([
  z.object({ fichier: fichierSchema, lien: z.null() }),
  z.object({ fichier: z.null(), lien: lienSchema }),
]);

const mesureSchema = z.object({
  actionId: z.string(),
  identifiant: z.string(),
});

const attenduDefinitionSchema = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string(),
});

const documentBaseSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  commentaire: z.string().nullable(),
  modifiedAt: z.string(),
  modifiedBy: z.string().nullable(),
  modifiedByNom: z.string().nullable(),
  action: mesureSchema,
});

const documentReglementaireSchema = documentBaseSchema
  .extend({
    preuveType: z.literal('reglementaire'),
    preuveReglementaire: attenduDefinitionSchema,
  })
  .and(supportSchema);

const documentComplementaireSchema = documentBaseSchema
  .extend({ preuveType: z.literal('complementaire') })
  .and(supportSchema);

const attenduSchema = z.object({
  preuveReglementaire: attenduDefinitionSchema,
  action: mesureSchema,
  documents: z.array(documentReglementaireSchema),
});

export const listDocumentsMesureOutputSchema = z.object({
  attendus: z.array(attenduSchema),
  complementaires: z.array(documentComplementaireSchema),
});

export type ListDocumentsMesureOutput = z.infer<
  typeof listDocumentsMesureOutputSchema
>;
export type Attendu = z.infer<typeof attenduSchema>;
export type DocumentReglementaire = z.infer<typeof documentReglementaireSchema>;
export type DocumentComplementaire = z.infer<
  typeof documentComplementaireSchema
>;
