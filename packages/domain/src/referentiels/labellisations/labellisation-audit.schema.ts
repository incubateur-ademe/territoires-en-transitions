import * as z from 'zod/mini';
import { referentielIdEnumSchema } from '../referentiel-id.enum';

export const labellisationAuditSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
  demandeId: z.nullable(z.number()),
  dateDebut: z.nullable(z.iso.datetime()),
  dateFin: z.nullable(z.iso.datetime()),
  valide: z.boolean(),
  dateCnl: z.nullable(z.iso.datetime()),
  valideLabellisation: z.nullable(z.boolean()),
  clos: z.boolean(),
});

export type LabellisationAudit = z.infer<typeof labellisationAuditSchema>;
