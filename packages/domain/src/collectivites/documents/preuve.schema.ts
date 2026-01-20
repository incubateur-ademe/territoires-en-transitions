import * as z from 'zod/mini';
import { bibliothequeFichierSchema } from './bibliotheque-fichier.schema';
import { preuveAuditSchema } from './preuve-audit.schema';
import { preuveComplementaireSchema } from './preuve-complementaire.schema';
import { preuveLabellisationSchema } from './preuve-labellisation.schema';
import { preuveRapportSchema } from './preuve-rapport.schema';
import { preuveReglementaireSchema } from './preuve-reglementaire.schema';
import { preuveTypeEnumValues } from './preuve-type.enum.schema';

export const preuveSchema = z.required(
  z.object({
    ...z.partial(preuveReglementaireSchema, {
      preuveId: true,
    }).shape,
    ...bibliothequeFichierSchema.shape,
    ...z.partial(preuveRapportSchema, { date: true }).shape,
    ...z.partial(preuveComplementaireSchema, { actionId: true }).shape,
    ...z.partial(preuveAuditSchema, { auditId: true }).shape,
    ...z.partial(preuveLabellisationSchema, { demandeId: true }).shape,

    preuveType: z.enum(preuveTypeEnumValues),
  }),
  {
    id: true,
    collectiviteId: true,
    modifiedAt: true,
  }
);

export type Preuve = z.infer<typeof preuveSchema>;
export type PreuveDto = Preuve; // Alias for backward compatibility

export const preuveSchemaEssential = z.pick(preuveSchema, {
  titre: true,
  commentaire: true,
  url: true,
  preuveType: true,
  preuveId: true,
  fichierId: true,
  filename: true,
  confidentiel: true,
  modifiedAt: true,
});

export type PreuveEssential = z.infer<typeof preuveSchemaEssential>;
