import { z } from 'zod';

export const updatePlanReferentSchema = z.object({
  tagId: z.number().nullable(),
  userId: z.string().nullable(),
});

export type UpdatePlanReferentsSchema = z.infer<
  typeof updatePlanReferentSchema
>;

export const updatePlanPiloteSchema = z.object({
  tagId: z.number().nullable(),
  userId: z.string().nullable(),
});

export type UpdatePlanPilotesSchema = z.infer<typeof updatePlanPiloteSchema>;

export const createPlanSchema = z.object({
  nom: z.string().min(1, 'Le nom du plan est requis'),
  collectiviteId: z
    .number()
    .positive("L'ID de la collectivité doit être positif"),
  typeId: z.number().optional(),
  referents: z.array(updatePlanReferentSchema).optional(),
  pilotes: z.array(updatePlanPiloteSchema).optional(),
});

export const updatePlanSchema = z.object({
  id: z.number().positive("L'ID du plan est requis"),
  nom: z.string().min(1, 'Le nom du plan est requis').optional(),
  collectiviteId: z.number().positive("L'ID de la collectivité est requis"),
  typeId: z.number().optional(),
  panierId: z.number().optional(),
  referents: z.array(updatePlanReferentSchema).optional(),
  pilotes: z.array(updatePlanPiloteSchema).optional(),
});

export const upsertPlanSchema = createPlanSchema;

export const getPlanSchema = z.object({
  planId: z.number().positive("L'ID du plan doit être positif"),
});

export const setReferentsSchema = z.object({
  planId: z.number(),
  referents: z.array(updatePlanReferentSchema),
});

export const setPilotesSchema = z.object({
  planId: z.number(),
  pilotes: z.array(updatePlanPiloteSchema),
});

export const deleteAxeSchema = z.object({
  axeId: z.number().positive("L'ID de l'axe est requis"),
});

export const deletePlanSchema = z.object({
  planId: z.number().positive("L'ID du plan est requis"),
});

export const flatAxeSchema = z.object({
  id: z.number(),
  nom: z.string().nullable(),
  fiches: z.array(z.number()),
  ancestors: z.array(z.number()),
  depth: z.number(),
  sort_path: z.string(),
  collectiviteId: z.number(),
});

export type FlatAxe = z.infer<typeof flatAxeSchema>;

export type PlanType = {
  categorie: string;
  detail: string | null;
  id: number;
  type: string;
};

export type PlanNode = Omit<FlatAxe, 'ancestors' | 'sort_path'> & {
  parent: number | null;
};

export type PlanReferentOrPilote = UpdatePlanReferentsSchema & {
  userName: string | null;
  tagName: string | null;
};

export type CreatePlanRequest = z.infer<typeof createPlanSchema>;
export type UpdatePlanRequest = z.infer<typeof updatePlanSchema>;
export type UpsertPlanRequest = z.infer<typeof upsertPlanSchema>;
export type GetPlanRequest = z.infer<typeof getPlanSchema>;
export type SetReferentsRequest = z.infer<typeof setReferentsSchema>;
export type SetPilotesRequest = z.infer<typeof setPilotesSchema>;
export type DeleteAxeRequest = z.infer<typeof deleteAxeSchema>;
export type DeletePlanRequest = z.infer<typeof deletePlanSchema>;
export const createAxeRequestSchema = createPlanSchema
  .omit({
    typeId: true,
    referents: true,
    pilotes: true,
  })
  .extend({
    planId: z.number(),
    parent: z.number(),
  });

export type CreateAxeRequest = z.infer<typeof createAxeRequestSchema>;
export const updateAxeRequestSchema = createAxeRequestSchema.extend({
  id: z.number(),
  parent: z.number(),
});
export type UpdateAxeRequest = z.infer<typeof updateAxeRequestSchema>;

export type DetailedPlan = {
  id: number;
  nom: string | null;
  axes: PlanNode[];
  referents: PlanReferentOrPilote[];
  pilotes: PlanReferentOrPilote[];
  type: PlanType | null;
  collectiviteId: number;
  createdAt: string;
};
