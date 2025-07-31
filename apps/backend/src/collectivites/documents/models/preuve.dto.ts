import z from 'zod';
import { bibliothequeFichierSchema } from './bibliotheque-fichier.table';
import { preuveAuditSchema } from './preuve-audit.table';
import { preuveComplementaireSchema } from './preuve-complementaire.table';
import { preuveLabellisationSchema } from './preuve-labellisation.table';
import { preuveRapportSchema } from './preuve-rapport.table';
import { preuveReglementaireSchema } from './preuve-reglementaire.table';
import { preuveTypeValues } from './preuve-type.enum';

export const preuveSchema = preuveReglementaireSchema
  .partial({
    preuveId: true,
  })
  .merge(bibliothequeFichierSchema)
  .merge(preuveRapportSchema.partial({ date: true }))
  .merge(
    preuveComplementaireSchema.partial({
      actionId: true,
    })
  )
  .merge(
    preuveAuditSchema.partial({
      auditId: true,
    })
  )
  .merge(
    preuveLabellisationSchema.partial({
      demandeId: true,
    })
  )
  .extend({
    preuveType: z.enum(preuveTypeValues),
  })
  .required({
    id: true,
    collectiviteId: true,
    modifiedAt: true,
  });

export type PreuveDto = z.infer<typeof preuveSchema>;

export const preuveSchemaEssential = preuveSchema.pick({
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
