import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const transportPersonnesElectrificationRequestSchema = z.strictObject({
  id: z.literal('transport_personnes_electrification'),
  territory: territorySchema,
  parameters: z.strictObject({
    carElectrificationFraction: fractionSchema,
    busElectrificationFraction: fractionSchema,
    railShareFraction: fractionSchema.optional(),
  }),
})

type TransportPersonnesElectrificationRequestInput = z.input<
  typeof transportPersonnesElectrificationRequestSchema
>

type TransportPersonnesElectrificationRequest = z.output<
  typeof transportPersonnesElectrificationRequestSchema
> & {
  readonly territory: { readonly level: ComputedLevels<'transport_personnes_electrification'> }
}

export { transportPersonnesElectrificationRequestSchema }
export type {
  TransportPersonnesElectrificationRequest,
  TransportPersonnesElectrificationRequestInput,
}
