import { secteurReglementaireEnumSchema } from '@tet/domain/plans';
import { z } from 'zod';

export const ficheSecteursAVerifierSchema = z.object({
  ficheId: z.number(),
  titre: z.string().nullable(),
  parentId: z.number().nullable(),
  parentTitre: z.string().nullable(),
  etat: z.enum([
    'en_cours_de_calcul',
    'a_renseigner',
    'non_attribuable',
    'attribue',
  ]),
  /** Secteurs d'une fiche attribuée, demandés avec `includeAttribues`. */
  secteurs: z.array(secteurReglementaireEnumSchema).optional(),
});

export type FicheSecteursAVerifier = z.infer<
  typeof ficheSecteursAVerifierSchema
>;

export const listPlanFichesSecteursAVerifierOutputSchema = z.array(
  ficheSecteursAVerifierSchema
);

export type ListPlanFichesSecteursAVerifierOutput = z.infer<
  typeof listPlanFichesSecteursAVerifierOutputSchema
>;
