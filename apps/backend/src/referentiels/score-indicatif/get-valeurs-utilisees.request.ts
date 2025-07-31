import z from "zod";

export const getValeursUtiliseesRequestSchema = z.object({
  actionIds: z.string().array(),
  collectiviteId: z.number(),
});

export type GetValeursUtiliseesRequest = z.infer<
  typeof getValeursUtiliseesRequestSchema
>;
