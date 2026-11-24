import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const dechetsSobrieteRequestSchema = z.strictObject({
  id: z.literal('dechets_sobriete'),
  territory: territorySchema,
  parameters: z.strictObject({
    storageReductionFraction: fractionSchema,
    incinerationReductionFraction: fractionSchema,
  }),
})

type DechetsSobrieteRequestInput = z.input<typeof dechetsSobrieteRequestSchema>

type DechetsSobrieteRequest = z.output<typeof dechetsSobrieteRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'dechets_sobriete'> }
}

export { dechetsSobrieteRequestSchema }
export type { DechetsSobrieteRequest, DechetsSobrieteRequestInput }
