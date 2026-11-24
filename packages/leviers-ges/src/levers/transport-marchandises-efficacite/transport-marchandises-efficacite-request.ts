import { z } from 'zod'
import {
  fractionSchema,
  relativeChangeSchema,
  territorySchema,
} from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const loadFactorIncreaseSchema = relativeChangeSchema.refine(
  (increase) => !increase.isNegative(),
  'must be 0 or more',
)

const transportMarchandisesEfficaciteRequestSchema = z.strictObject({
  id: z.literal('transport_marchandises_efficacite'),
  territory: territorySchema,
  parameters: z.strictObject({
    ecodrivingApplicationFraction: fractionSchema,
    loadFactorIncrease: loadFactorIncreaseSchema,
  }),
})

type TransportMarchandisesEfficaciteRequestInput = z.input<
  typeof transportMarchandisesEfficaciteRequestSchema
>

type TransportMarchandisesEfficaciteRequest = z.output<
  typeof transportMarchandisesEfficaciteRequestSchema
> & {
  readonly territory: { readonly level: ComputedLevels<'transport_marchandises_efficacite'> }
}

export { transportMarchandisesEfficaciteRequestSchema }
export type {
  TransportMarchandisesEfficaciteRequest,
  TransportMarchandisesEfficaciteRequestInput,
}
