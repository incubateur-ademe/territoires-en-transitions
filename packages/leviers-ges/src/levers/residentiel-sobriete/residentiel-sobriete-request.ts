import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const residentielSobrieteRequestSchema = z.strictObject({
  id: z.literal('residentiel_sobriete'),
  territory: territorySchema,
  parameters: z.strictObject({
    householdsApplyingSobrietyFraction: fractionSchema,
    consumptionReductionFraction: fractionSchema,
  }),
})

type ResidentielSobrieteRequestInput = z.input<typeof residentielSobrieteRequestSchema>

type ResidentielSobrieteRequest = z.output<typeof residentielSobrieteRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'residentiel_sobriete'> }
}

export { residentielSobrieteRequestSchema }
export type { ResidentielSobrieteRequest, ResidentielSobrieteRequestInput }
