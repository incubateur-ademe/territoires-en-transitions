import z from "zod";

export const getScoreIndicatifRequestSchema = z.object({
  actionId: z.string(),
  collectiviteId: z.number(),
});

export type GetScoreIndicatifRequest = z.infer<
  typeof getScoreIndicatifRequestSchema
>;
