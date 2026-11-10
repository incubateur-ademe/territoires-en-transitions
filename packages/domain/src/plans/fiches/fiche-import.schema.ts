import * as z from 'zod/mini';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';
import { ficheSchema } from './fiche.schema';
import { statutEnumSchema } from './statut.enum.schema';

/** Champs documentaires d'une fiche, avant résolution des structures et partenaires. */
export const ficheImportFieldsSchema = z.partial(
  z.strictObject({
    titre: ficheSchema.shape.titre.unwrap().trim().min(1).nullable(),
    description: ficheSchema.shape.description
      .unwrap()
      .trim()
      .min(1)
      .nullable(),
    objectifs: ficheSchema.shape.objectifs.unwrap().trim().min(1).nullable(),
    // Moyens humains explicitement renseignés ; aucune déduction depuis les structures.
    ressources: ficheSchema.shape.ressources.unwrap().trim().min(1).nullable(),
    structures: z.nullable(z.array(nonBlankTextSchema)),
    partenaires: z.nullable(z.array(nonBlankTextSchema)),
    dateDebut: z.nullable(z.iso.date()),
    dateFin: z.nullable(z.iso.date()),
    statut: z.nullable(statutEnumSchema),
  })
);
export type FicheImportFields = z.infer<typeof ficheImportFieldsSchema>;
