import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const getActionStatutsRequestSchema = extendApi(
  z.object({
    date: z.string().datetime().optional(),
  })
).openapi({
  title: 'Date pour laquelle le statut des actions est demandé',
});
export type GetActionStatutsRequestType = z.infer<
  typeof getActionStatutsRequestSchema
>;
