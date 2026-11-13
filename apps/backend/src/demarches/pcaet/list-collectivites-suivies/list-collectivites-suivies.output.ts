import { z } from 'zod';
import {
  perimetreDepartementSchema,
  perimetreRegionSchema,
} from '../list-dossiers-instruction/list-dossiers-instruction.output';

export const collectiviteSuivieSchema = z.object({
  id: z.number().int(),
  nom: z.string(),
  departementCode: z.string().nullable(),
  departementLibelle: z.string().nullable(),
  regionCode: z.string().nullable(),
  regionLibelle: z.string().nullable(),
  /** Le Supra dont le dépôt la couvre, `null` si elle n'est couverte par aucun. */
  porteur: z.object({ id: z.number().int(), nom: z.string() }).nullable(),
  /** Porte un dépôt pour plusieurs EPCI. */
  isSupra: z.boolean(),
});

export type CollectiviteSuivie = z.infer<typeof collectiviteSuivieSchema>;

/**
 * Ce qu'un service peut chercher dans sa liste d'instruction : les
 * collectivités de son territoire, porteuses ou couvertes par un Supra, et les
 * départements et régions qui les rangent. Sans statut ni dates — de quoi
 * suggérer, pas de quoi afficher un dossier.
 */
export const listCollectivitesSuiviesOutputSchema = z.object({
  collectivites: collectiviteSuivieSchema.array(),
  departements: perimetreDepartementSchema.array(),
  regions: perimetreRegionSchema.array(),
});

export type ListCollectivitesSuiviesOutput = z.infer<
  typeof listCollectivitesSuiviesOutputSchema
>;
