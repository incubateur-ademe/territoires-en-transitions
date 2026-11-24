import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const residentielRenovationRequestSchema = z.strictObject({
  id: z.literal('residentiel_renovation'),
  territory: territorySchema,
  parameters: z.strictObject({
    renovatedParcFraction: fractionSchema,
  }),
})

type ResidentielRenovationRequestInput = z.input<typeof residentielRenovationRequestSchema>

type ResidentielRenovationRequest = z.output<typeof residentielRenovationRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'residentiel_renovation'> }
}

export { residentielRenovationRequestSchema }
export type { ResidentielRenovationRequest, ResidentielRenovationRequestInput }
