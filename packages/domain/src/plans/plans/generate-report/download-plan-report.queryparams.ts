import z from 'zod';

export const downloadPlanReportQueryParamsSchema = z.object({
  downloadReportId: z.string(),
});

export type DownloadPlanReportQueryParams = z.infer<
  typeof downloadPlanReportQueryParamsSchema
>;
