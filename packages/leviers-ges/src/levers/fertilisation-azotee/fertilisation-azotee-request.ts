import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const fertilisationAzoteeRequestSchema = z.strictObject({
  id: z.literal('fertilisation_azotee'),
  territory: territorySchema,
  parameters: z.strictObject({ nitrogenReductionFraction: fractionSchema }),
})

type FertilisationAzoteeRequestInput = z.input<typeof fertilisationAzoteeRequestSchema>

type FertilisationAzoteeRequest = z.output<typeof fertilisationAzoteeRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'fertilisation_azotee'> }
}

export { fertilisationAzoteeRequestSchema }
export type { FertilisationAzoteeRequest, FertilisationAzoteeRequestInput }
