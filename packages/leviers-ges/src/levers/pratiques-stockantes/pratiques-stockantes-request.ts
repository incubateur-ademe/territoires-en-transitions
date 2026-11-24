import { z } from 'zod'
import { nonNegativeHectaresSchema } from '../../application/estimate/shared-schemas.ts'

const pratiquesStockantesRequestSchema = z.strictObject({
  id: z.literal('pratiques_stockantes'),
  parameters: z.strictObject({
    intermediateCropsHectares: nonNegativeHectaresSchema,
    permanentVineyardGrassingHectares: nonNegativeHectaresSchema,
    winterIntercropVineyardHectares: nonNegativeHectaresSchema,
    agroforestryHectares: nonNegativeHectaresSchema,
    temporaryGrasslandExtensionHectares: nonNegativeHectaresSchema,
  }),
})

type PratiquesStockantesRequestInput = z.input<typeof pratiquesStockantesRequestSchema>

type PratiquesStockantesRequest = z.output<typeof pratiquesStockantesRequestSchema>

export { pratiquesStockantesRequestSchema }
export type { PratiquesStockantesRequest, PratiquesStockantesRequestInput }
