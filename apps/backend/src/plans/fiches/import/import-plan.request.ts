import {
  updatePlanPiloteSchema,
  updatePlanReferentSchema,
} from '@tet/domain/plans';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const importRequestSchema = z.object({
  collectiviteId: z.number(),
  planName: z.string(),
  planType: z.number().optional(),
  referents: z.array(updatePlanReferentSchema).optional(),
  pilotes: z.array(updatePlanPiloteSchema).optional(),
  file: z.string(),
});

export class ImportRequestClass extends createZodDto(importRequestSchema) {}
