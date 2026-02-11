import * as z from 'zod/mini';
import { labellisationAuditSchema } from '../../referentiels';
import { labellisationDemandeSchema } from '../../referentiels/labellisations/labellisation-demande.schema';
import { bibliothequeFichierSchema } from './bibliotheque-fichier.schema';
import { preuveAuditSchema } from './preuve-audit.schema';

export const preuveAuditWithFichierSchema = z.extend(preuveAuditSchema, {
  fichier: z.nullable(
    z.extend(bibliothequeFichierSchema, {
      bucketId: z.string(),
    })
  ),
  demande: z.nullable(labellisationDemandeSchema),
  createdByNom: z.nullable(z.string()),
  createdAt: z.iso.datetime(),
  createdBy: z.nullable(z.string()),
  preuveType: z.literal('audit'),
  action: z.null(),
  preuveReglementaire: z.null(),
  rapport: z.null(),
  audit: z.nullable(labellisationAuditSchema),
});

export type LegacyPreuveAuditWithFichier = z.infer<
  typeof preuveAuditWithFichierSchema
>;
