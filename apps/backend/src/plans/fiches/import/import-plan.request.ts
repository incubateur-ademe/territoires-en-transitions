import { personneIdSchema } from '@tet/domain/collectivites';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const importRequestSchema = z.object({
  collectiviteId: z.number(),
  planName: z.string(),
  planType: z.number().optional(),
  referents: z.array(personneIdSchema).optional(),
  pilotes: z.array(personneIdSchema).optional(),
  file: z.string(),
});

export class ImportRequestClass extends createZodDto(importRequestSchema) {}
