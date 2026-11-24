import { z } from 'zod'
import {
  fractionSchema,
  relativeChangeSchema,
  territorySchema,
} from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const passengerIncreaseSchema = relativeChangeSchema.refine(
  (increase) => !increase.isNegative(),
  'must be 0 or more',
)

const transportPersonnesEfficaciteRequestSchema = z.strictObject({
  id: z.literal('transport_personnes_efficacite'),
  territory: territorySchema,
  parameters: z.strictObject({
    carEcodrivingApplicationFraction: fractionSchema,
    busEcodrivingApplicationFraction: fractionSchema,
    carPassengerIncrease: passengerIncreaseSchema,
    busPassengerIncrease: passengerIncreaseSchema,
    railShareFraction: fractionSchema.optional(),
  }),
})

type TransportPersonnesEfficaciteRequestInput = z.input<
  typeof transportPersonnesEfficaciteRequestSchema
>

type TransportPersonnesEfficaciteRequest = z.output<
  typeof transportPersonnesEfficaciteRequestSchema
> & {
  readonly territory: { readonly level: ComputedLevels<'transport_personnes_efficacite'> }
}

export { transportPersonnesEfficaciteRequestSchema }
export type { TransportPersonnesEfficaciteRequest, TransportPersonnesEfficaciteRequestInput }
