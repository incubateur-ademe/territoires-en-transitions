import {
  DOSSIER_LABELLISATION_STATUTS_PAR_DEFAUT,
  dossierLabellisationStatutValues,
  etoileAsStringEnumValues,
  referentielIdEnumValues,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import z from 'zod';

export const listDossiersLabellisationInputSchema = z.object({
  // Liste vide = pas de filtre ; absent = les dossiers en cours
  statuts: z
    .array(z.enum(dossierLabellisationStatutValues))
    .default([...DOSSIER_LABELLISATION_STATUTS_PAR_DEFAUT]),
  referentielIds: z.array(z.enum(referentielIdEnumValues)).default([]),
  sujets: z.array(z.enum(SujetDemandeEnum)).default([]),
  search: z.string().trim().optional(),
});
export type ListDossiersLabellisationInput = z.input<
  typeof listDossiersLabellisationInputSchema
>;

export const dossierLabellisationIdInputSchema = z.object({
  auditId: z.number().int(),
});

export const getActeEngagementDownloadUrlInputSchema = z.object({
  auditId: z.number().int(),
  fichierId: z.number().int().positive(),
});
export type GetActeEngagementDownloadUrlInput = z.infer<
  typeof getActeEngagementDownloadUrlInputSchema
>;

export const updateDemandeLabellisationInputSchema = z.object({
  auditId: z.number().int(),
  sujet: z.enum(SujetDemandeEnum),
  etoiles: z.enum(etoileAsStringEnumValues).nullable(),
});
export type UpdateDemandeLabellisationInput = z.infer<
  typeof updateDemandeLabellisationInputSchema
>;

// Par email : personne absente de la liste des auditeurs, qui reçoit alors le rôle
export const addAuditeurInputSchema = z.union([
  z.strictObject({ auditId: z.number().int(), userId: z.uuid() }),
  z.strictObject({
    auditId: z.number().int(),
    email: z.email().trim().toLowerCase(),
  }),
]);
export type AddAuditeurInput = z.infer<typeof addAuditeurInputSchema>;

export const removeAuditeurInputSchema = z.object({
  auditId: z.number().int(),
  userId: z.uuid(),
});
export type RemoveAuditeurInput = z.infer<typeof removeAuditeurInputSchema>;

export const closeDossierLabellisationInputSchema = z.discriminatedUnion(
  'decision',
  [
    z.object({
      auditId: z.number().int(),
      decision: z.literal('labelliser'),
      etoiles: z.number().int().min(1).max(5),
      dateCra: z.iso.date(),
    }),
    z.object({
      auditId: z.number().int(),
      decision: z.literal('valider_premiere_etoile'),
      date: z.iso.date(),
    }),
    z.object({
      auditId: z.number().int(),
      decision: z.literal('clore'),
    }),
  ]
);
export type CloseDossierLabellisationInput = z.infer<
  typeof closeDossierLabellisationInputSchema
>;

export const listCotInputSchema = z.object({
  search: z.string().trim().optional(),
});

export const toggleCotActifInputSchema = z.object({
  collectiviteId: z.number().int(),
  actif: z.boolean(),
});
export type ToggleCotActifInput = z.infer<typeof toggleCotActifInputSchema>;
