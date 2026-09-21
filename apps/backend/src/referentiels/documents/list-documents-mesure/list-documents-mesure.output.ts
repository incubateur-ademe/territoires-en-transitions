import {
  documentCollectiviteSchema,
  preuveReglementaireDefinitionSchema,
} from '@tet/domain/collectivites';
import z from 'zod';

const mesureSchema = z.object({
  actionId: z.string(),
  identifiant: z.string(),
});

const documentMesureSchema = documentCollectiviteSchema.and(
  z.object({ action: mesureSchema })
);

const documentReglementaireSchema = documentMesureSchema.and(
  z.object({
    preuveType: z.literal('reglementaire'),
    preuveReglementaire: preuveReglementaireDefinitionSchema,
  })
);

const documentComplementaireSchema = documentMesureSchema.and(
  z.object({ preuveType: z.literal('complementaire') })
);

const attenduSchema = z.object({
  preuveReglementaire: preuveReglementaireDefinitionSchema,
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
