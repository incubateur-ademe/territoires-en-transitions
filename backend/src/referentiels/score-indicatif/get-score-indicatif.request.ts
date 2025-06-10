import z from "zod";

export const getScoreIndicatifRequestSchema = z.object({
  actionIds: z.string().array(),
  collectiviteId: z.number(),
});

export type GetScoreIndicatifRequest = z.infer<
  typeof getScoreIndicatifRequestSchema
>;
