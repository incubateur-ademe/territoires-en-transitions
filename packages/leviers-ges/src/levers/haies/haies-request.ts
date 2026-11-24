import { z } from 'zod'
import { kilometresSchema } from '../../application/estimate/shared-schemas.ts'

const haiesRequestSchema = z.strictObject({
  id: z.literal('haies'),
  parameters: z.strictObject({ hedgeKmCreatedPerYear: kilometresSchema }),
})

type HaiesRequestInput = z.input<typeof haiesRequestSchema>

type HaiesRequest = z.output<typeof haiesRequestSchema>

export { haiesRequestSchema }
export type { HaiesRequest, HaiesRequestInput }
