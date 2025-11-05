import * as z from 'zod/mini';
import { referentielIdEnumSchema } from '../referentiel-id.enum';
import { etoileAsStringEnumSchema } from './labellisation-etoile.enum.schema';

export const SujetDemandeEnum = {
  LABELLISATION: 'labellisation',
  LABELLISATION_COT: 'labellisation_cot',
  COT: 'cot',
} as const;

export const sujetDemandeEnumSchema = z.enum(SujetDemandeEnum);

export type SujetDemande =
  (typeof SujetDemandeEnum)[keyof typeof SujetDemandeEnum];

export const labellisationDemandeSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  referentiel: referentielIdEnumSchema,
  enCours: z.optional(z.boolean()),
  etoiles: z.nullable(etoileAsStringEnumSchema),
  date: z.optional(z.iso.date()),
  sujet: z.nullable(sujetDemandeEnumSchema),
  modifiedAt: z.nullable(z.iso.datetime()),
  envoyeeLe: z.nullable(z.iso.datetime()),
  demandeur: z.nullable(z.uuid()),
  associatedCollectiviteId: z.nullable(z.number()),
});

export type LabellisationDemande = z.infer<typeof labellisationDemandeSchema>;
