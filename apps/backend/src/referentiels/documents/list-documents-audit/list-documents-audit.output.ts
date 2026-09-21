import {
  labellisationAuditSchema,
  labellisationDemandeSchema,
} from '@tet/domain/referentiels';
import z from 'zod';
import {
  documentBaseSchema,
  supportSchema,
} from '../referentiel-documents.schema';

const documentAuditSchema = documentBaseSchema
  .extend({
    preuveType: z.literal('audit'),
    auditId: z.number(),
    demande: z.nullable(labellisationDemandeSchema),
    audit: labellisationAuditSchema,
  })
  .and(supportSchema);

export const listDocumentsAuditOutputSchema = z.array(documentAuditSchema);

export type DocumentAudit = z.infer<typeof documentAuditSchema>;
