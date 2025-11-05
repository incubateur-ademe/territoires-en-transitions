import z from 'zod';

export const chartRenderRequestSchema = z.object({
  name: z.string().optional(),
  format: z.enum(['png', 'svg']).default('png'),
  width: z.number().int().default(800),
  height: z.number().int().default(600),
  options: z.any(),
});

export type ChartRenderRequestType = z.infer<typeof chartRenderRequestSchema>;


