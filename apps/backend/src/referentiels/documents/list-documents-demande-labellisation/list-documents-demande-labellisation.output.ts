import {
  labellisationDemandeSchema,
  objetPreuveEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';
import {
  documentBaseSchema,
  supportSchema,
} from '../referentiel-documents.schema';

const documentDemandeLabellisationSchema = documentBaseSchema
  .extend({
    preuveType: z.literal('labellisation'),
    demandeId: z.number(),
    objet: z.nullable(objetPreuveEnumSchema),
    demande: z.nullable(labellisationDemandeSchema),
  })
  .and(supportSchema);

export const listDocumentsDemandeLabellisationOutputSchema = z.array(
  documentDemandeLabellisationSchema
);

export type DocumentDemandeLabellisation = z.infer<
  typeof documentDemandeLabellisationSchema
>;
