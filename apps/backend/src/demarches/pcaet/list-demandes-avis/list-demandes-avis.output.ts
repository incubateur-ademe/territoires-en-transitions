import {
  demarchePcaetStatusSchema,
  pcaetDemandeAvisEtatSchema,
  pcaetDemandeAvisEtatValues,
} from '@tet/domain/demarches';
import { z } from 'zod';

export const demandeAvisContactSchema = z.object({
  prenom: z.string(),
  nom: z.string(),
  email: z.string(),
});

export type DemandeAvisContact = z.infer<typeof demandeAvisContactSchema>;

export const demandeAvisLigneSchema = z.object({
  demandeAvisId: z.number().int(),
  demarcheId: z.number().int(),
  demarcheTitre: z.string(),
  demarcheStatus: demarchePcaetStatusSchema,
  avisDeadlineAt: z.string().nullable(),
  transmittedAt: z.string().nullable(),
  collectivite: z.object({
    id: z.number().int(),
    nom: z.string(),
    departementCode: z.string().nullable(),
  }),
  contacts: demandeAvisContactSchema.array(),
  /**
   * Ce dossier attend-il un avis de ce service, ou se contente-t-il de le lui
   * donner à lire ?
   *
   * Par ligne, et non par service : une DREAL dépose sur le dossier de sa
   * région et lit celui de l'EPCI voisin qui déborde chez elle. L'écran lit ce
   * drapeau plutôt que de déduire un droit du type de la collectivité.
   */
  deposeAvis: z.boolean(),
  etat: pcaetDemandeAvisEtatSchema,
  nbAvisValides: z.number().int(),
  nbAvisBrouillons: z.number().int(),
});

export type DemandeAvisLigne = z.infer<typeof demandeAvisLigneSchema>;

export const demandesAvisStatsSchema = z.object({
  delaiMoyenJours: z.number().int().nullable(),
});

export type DemandesAvisStats = z.infer<typeof demandesAvisStatsSchema>;

export const listDemandesAvisOutputSchema = z.object({
  items: demandeAvisLigneSchema.array(),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  countByEtat: z.record(pcaetDemandeAvisEtatSchema, z.number().int()),
  stats: demandesAvisStatsSchema,
});

export type ListDemandesAvisOutput = z.infer<
  typeof listDemandesAvisOutputSchema
>;

export const emptyCountByEtat = (): Record<
  (typeof pcaetDemandeAvisEtatValues)[number],
  number
> => ({
  a_traiter: 0,
  brouillon_en_cours: 0,
  avis_rendu: 0,
  delai_ecoule: 0,
  clos: 0,
});
