import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const transportPersonnesSobrieteDeplacementsRequestSchema = z.strictObject({
  id: z.literal('transport_personnes_sobriete_deplacements'),
  territory: territorySchema,
  parameters: z.strictObject({
    commutingDistanceReductionFraction: fractionSchema,
    railShareFraction: fractionSchema.optional(),
  }),
})

type TransportPersonnesSobrieteDeplacementsRequestInput = z.input<
  typeof transportPersonnesSobrieteDeplacementsRequestSchema
>

type TransportPersonnesSobrieteDeplacementsRequest = z.output<
  typeof transportPersonnesSobrieteDeplacementsRequestSchema
> & {
  readonly territory: { readonly level: ComputedLevels<'transport_personnes_sobriete_deplacements'> }
}

export { transportPersonnesSobrieteDeplacementsRequestSchema }
export type {
  TransportPersonnesSobrieteDeplacementsRequest,
  TransportPersonnesSobrieteDeplacementsRequestInput,
}
