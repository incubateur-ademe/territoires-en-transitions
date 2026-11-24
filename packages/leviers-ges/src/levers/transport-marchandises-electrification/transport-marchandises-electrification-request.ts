import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const transportMarchandisesElectrificationRequestSchema = z.strictObject({
  id: z.literal('transport_marchandises_electrification'),
  territory: territorySchema,
  parameters: z.strictObject({ additionalElectrifiedFleetFraction: fractionSchema }),
})

type TransportMarchandisesElectrificationRequestInput = z.input<
  typeof transportMarchandisesElectrificationRequestSchema
>

type TransportMarchandisesElectrificationRequest = z.output<
  typeof transportMarchandisesElectrificationRequestSchema
> & {
  readonly territory: {
    readonly level: ComputedLevels<'transport_marchandises_electrification'>
  }
}

export { transportMarchandisesElectrificationRequestSchema }
export type {
  TransportMarchandisesElectrificationRequest,
  TransportMarchandisesElectrificationRequestInput,
}
