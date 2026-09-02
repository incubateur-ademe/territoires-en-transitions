import * as z from 'zod/mini';
import { labellisationDemandeSchema } from '../../referentiels/labellisations/labellisation-demande.schema';
import { bibliothequeFichierSchema } from './bibliotheque-fichier.schema';
import { preuveLabellisationSchema } from './preuve-labellisation.schema';

export const preuveLabellisationWithFichierSchema = z.extend(
  preuveLabellisationSchema,
  {
    fichier: z.nullable(
      z.extend(bibliothequeFichierSchema, {
        bucketId: z.string(),
      })
    ),
    demande: z.nullable(labellisationDemandeSchema),
    modifiedByNom: z.nullable(z.string()),
    preuveType: z.literal('labellisation'),
    action: z.null(),
    preuveReglementaire: z.null(),
    rapport: z.null(),
    audit: z.null(),
  }
);

export type LegacyPreuveLabellisationWithFichier = z.infer<
  typeof preuveLabellisationWithFichierSchema
>;
