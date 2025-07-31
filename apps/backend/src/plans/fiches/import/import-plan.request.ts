import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const importRequestSchema = z.object({
  collectiviteId: z.number(),
  planName: z.string(),
  planType: z.number().optional(),
  file: z.string(),
});

export class ImportRequestClass extends createZodDto(
  importRequestSchema
) {}
