import * as z from 'zod/mini';
import { nonBlankTextSchema } from '../../shared/non-blank-text.schema';

/** Identité du programme métier, indépendante du profil et du job d'import. */
export const PlanReferenceProgrammeEnum = {
  ELECTRIFICATION: 'electrification',
} as const;
export const planReferenceProgrammeSchema = z.enum(PlanReferenceProgrammeEnum);
export type PlanReferenceProgramme = z.infer<
  typeof planReferenceProgrammeSchema
>;

export const FicheReferenceKindEnum = {
  ACTION: 'action',
  SOUS_ACTION: 'sous_action',
  INDICATEUR_BOOLEEN: 'indicateur_booleen',
  ENGAGEMENT: 'engagement',
} as const;
export const ficheReferenceKindSchema = z.enum(FicheReferenceKindEnum);
export type FicheReferenceKind = z.infer<typeof ficheReferenceKindSchema>;

export const axeReferenceSchema = z.strictObject({
  programme: planReferenceProgrammeSchema,
  code: nonBlankTextSchema,
});
export type AxeReference = z.infer<typeof axeReferenceSchema>;

export const ficheReferenceSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    ...axeReferenceSchema.shape,
    kind: z.literal(FicheReferenceKindEnum.SOUS_ACTION),
    /**
     * Code de l'action catalogue au moment de l'import, conservé après
     * déplacement ou mise à jour du catalogue.
     */
    parentCode: nonBlankTextSchema,
  }),
  z.strictObject({
    ...axeReferenceSchema.shape,
    kind: z.enum([
      FicheReferenceKindEnum.ACTION,
      FicheReferenceKindEnum.INDICATEUR_BOOLEEN,
      FicheReferenceKindEnum.ENGAGEMENT,
    ]),
    parentCode: z.optional(z.null()),
  }),
]);
export type FicheReference = z.infer<typeof ficheReferenceSchema>;

/** Sélection explicite du plan ; un axe présent ne vaut pas engagement. */
export const planEngagementsSchema = z.strictObject({
  programme: planReferenceProgrammeSchema,
  codes: z.array(nonBlankTextSchema),
});
export type PlanEngagements = z.infer<typeof planEngagementsSchema>;

/** Références des objets actuellement rattachés au plan. */
export type PlanReferences = {
  planId: number;
  engagements: PlanEngagements | null;
  axes: { axeId: number; reference: AxeReference }[];
  fiches: { ficheId: number; reference: FicheReference }[];
};
