import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { quantity, type Fraction } from '../../domain/units.ts'

// Source : Scénario global Déchets, formule « 1 − % stockés vers incinérés − % stockés vers valorisation » : la part des stockés qui change de mode ne dépasse pas 100 %
const STORED_WASTE_SHIFT_CEILING: Fraction = quantity<'Fraction'>('1')

const dechetsModeDeTraitementRequestSchema = z.strictObject({
  id: z.literal('dechets_mode_de_traitement'),
  territory: territorySchema,
  parameters: z
    .strictObject({
      storageToIncinerationFraction: fractionSchema,
      storageToMaterialRecoveryFraction: fractionSchema,
      incinerationToMaterialRecoveryFraction: fractionSchema,
    })
    .refine(
      ({ storageToIncinerationFraction, storageToMaterialRecoveryFraction }) => {
        const storedWasteShift = storageToIncinerationFraction.plus(storageToMaterialRecoveryFraction)
        return storedWasteShift.isLessThanOrEqualTo(STORED_WASTE_SHIFT_CEILING)
      },
      {
        path: ['storageToMaterialRecoveryFraction'],
        message: 'must be at most 100% together with storageToIncinerationFraction',
        when: ({ issues }) => issues.length === 0,
      },
    ),
})

type DechetsModeDeTraitementRequestInput = z.input<typeof dechetsModeDeTraitementRequestSchema>

type DechetsModeDeTraitementRequest = z.output<typeof dechetsModeDeTraitementRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'dechets_mode_de_traitement'> }
}

export { dechetsModeDeTraitementRequestSchema }
export type { DechetsModeDeTraitementRequest, DechetsModeDeTraitementRequestInput }
