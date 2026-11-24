import { z } from 'zod'
import { relativeChangeSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'

const produitsBoisRequestSchema = z.strictObject({
  id: z.literal('produits_bois'),
  territory: territorySchema,
  parameters: z.strictObject({ woodProductionIncrease: relativeChangeSchema }),
})

type ProduitsBoisRequestInput = z.input<typeof produitsBoisRequestSchema>

type ProduitsBoisRequest = z.output<typeof produitsBoisRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'produits_bois'> }
}

export { produitsBoisRequestSchema }
export type { ProduitsBoisRequest, ProduitsBoisRequestInput }
