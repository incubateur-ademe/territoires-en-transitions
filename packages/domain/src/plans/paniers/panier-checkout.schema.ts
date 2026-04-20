import * as z from 'zod/mini';

const panierCheckoutLineLienSchema = z.object({
  url: z.string(),
  titre: z.string(),
});

export type PanierCheckoutLineLien = z.infer<
  typeof panierCheckoutLineLienSchema
>;

const panierCheckoutLineStatutSchema = z.union([
  z.literal('en_cours'),
  z.literal('realise'),
  z.null(),
]);

export type PanierCheckoutLineStatut = z.infer<
  typeof panierCheckoutLineStatutSchema
>;

export const panierCheckoutLineSchema = z.object({
  sourceActionImpactId: z.number(),
  titre: z.string(),
  description: z.string(),
  descriptionComplementaire: z.string(),
  statut: panierCheckoutLineStatutSchema,
  fourchetteBudgetaireNom: z.nullable(z.string()),
  thematiqueIds: z.array(z.number()),
  sousThematiqueIds: z.array(z.number()),
  indicateurIds: z.array(z.number()),
  effetAttenduIds: z.array(z.number()),
  mesureIds: z.array(z.string()),
  partenaireNoms: z.array(z.string()),
  liensExternes: z.array(panierCheckoutLineLienSchema),
});

export type PanierCheckoutLine = z.infer<typeof panierCheckoutLineSchema>;

export const panierCheckoutSchema = z.object({
  proprietaireCollectiviteId: z.nullable(z.number()),
  lines: z.array(panierCheckoutLineSchema),
});

export type PanierCheckout = z.infer<typeof panierCheckoutSchema>;
