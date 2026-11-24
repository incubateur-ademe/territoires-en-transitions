import { z } from 'zod'
import {
  nonNegativeHectaresPerYearSchema,
  positiveYearsSchema,
  territorySchema,
} from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const occupationDesSolsRequestSchema = z.strictObject({
  id: z.literal('occupation_des_sols'),
  territory: territorySchema,
  parameters: z.strictObject({
    afforestationHectaresPerYear: nonNegativeHectaresPerYearSchema,
    wetlandDevelopmentHectaresPerYear: nonNegativeHectaresPerYearSchema,
    desealingHectaresPerYear: nonNegativeHectaresPerYearSchema,
    horizonYears: positiveYearsSchema,
  }),
})

type OccupationDesSolsRequestInput = z.input<typeof occupationDesSolsRequestSchema>

type OccupationDesSolsRequest = z.output<typeof occupationDesSolsRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'occupation_des_sols'> }
}

export { occupationDesSolsRequestSchema }
export type { OccupationDesSolsRequest, OccupationDesSolsRequestInput }
