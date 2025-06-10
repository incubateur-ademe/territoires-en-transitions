import z from "zod";

export const getValeursUtilisablesRequestSchema = z.object({
  actionIds: z.string().array(),
  collectiviteId: z.number(),
});

export type GetValeursUtilisablesRequest = z.infer<
  typeof getValeursUtilisablesRequestSchema
>;
