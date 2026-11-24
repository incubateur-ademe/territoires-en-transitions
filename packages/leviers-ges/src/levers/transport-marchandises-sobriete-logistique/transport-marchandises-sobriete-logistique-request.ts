import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const transportMarchandisesSobrieteLogistiqueRequestSchema = z.strictObject({
  id: z.literal('transport_marchandises_sobriete_logistique'),
  territory: territorySchema,
  parameters: z.strictObject({ roadFreightReductionFraction: fractionSchema }),
})

type TransportMarchandisesSobrieteLogistiqueRequestInput = z.input<
  typeof transportMarchandisesSobrieteLogistiqueRequestSchema
>

type TransportMarchandisesSobrieteLogistiqueRequest = z.output<
  typeof transportMarchandisesSobrieteLogistiqueRequestSchema
> & {
  readonly territory: {
    readonly level: ComputedLevels<'transport_marchandises_sobriete_logistique'>
  }
}

export { transportMarchandisesSobrieteLogistiqueRequestSchema }
export type {
  TransportMarchandisesSobrieteLogistiqueRequest,
  TransportMarchandisesSobrieteLogistiqueRequestInput,
}
