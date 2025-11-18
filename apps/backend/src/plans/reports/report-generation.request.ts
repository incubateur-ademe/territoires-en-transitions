import z from "zod";

export const reportGenerationRequestSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
});

export type ReportGenerationRequest = z.infer<typeof reportGenerationRequestSchema>;