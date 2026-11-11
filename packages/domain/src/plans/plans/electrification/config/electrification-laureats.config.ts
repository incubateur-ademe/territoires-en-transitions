import * as z from 'zod/mini';
import { nonBlankTextSchema } from '../../../../shared/non-blank-text.schema';

export const electrificationLaureatsConfigSchema = z.object({
  source: nonBlankTextSchema,
  version: nonBlankTextSchema,
  validFrom: z.iso.datetime(),
  validUntil: z.nullable(z.iso.datetime()),
  laureats: z.array(
    z.object({
      reference: nonBlankTextSchema,
      collectiviteId: z.int().check(z.positive()),
    })
  ),
});

export type ElectrificationLaureatsConfig = z.infer<
  typeof electrificationLaureatsConfigSchema
>;
