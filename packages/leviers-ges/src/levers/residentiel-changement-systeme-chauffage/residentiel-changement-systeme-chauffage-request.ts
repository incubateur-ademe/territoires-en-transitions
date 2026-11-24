import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import { sum } from '../../domain/big-number.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { quantity, type Fraction } from '../../domain/units.ts'

// Source : PlanET V1, Residentiel_ChgtSyst!B15 : « la modification de la part d'un système de chauffage doit engendrer la modification de la part des autres systèmes » ; la somme des parts cibles vaut donc 100 %
const TARGET_SHARES_TOTAL: Fraction = quantity<'Fraction'>('1')

// Source : documentation fonctionnelle PlanET (juin 2026), p. 55 : cinq parts cibles, gaz, fioul, électricité et PAC, bois, réseau de chaleur
const TARGET_SHARE_COUNT = 5

type TargetShareParameters = {
  readonly targetElectricityShareFraction?: Fraction | undefined
  readonly targetNaturalGasShareFraction?: Fraction | undefined
  readonly targetFuelOilShareFraction?: Fraction | undefined
  readonly targetWoodShareFraction?: Fraction | undefined
  readonly targetHeatNetworkShareFraction?: Fraction | undefined
}

function givenShares(parameters: TargetShareParameters): readonly Fraction[] {
  return [
    parameters.targetElectricityShareFraction,
    parameters.targetNaturalGasShareFraction,
    parameters.targetFuelOilShareFraction,
    parameters.targetWoodShareFraction,
    parameters.targetHeatNetworkShareFraction,
  ].filter((share): share is Fraction => share !== undefined)
}

const residentielChangementSystemeChauffageRequestSchema = z.strictObject({
  id: z.literal('residentiel_changement_systeme_chauffage'),
  territory: territorySchema,
  parameters: z
    .strictObject({
      targetElectricityShareFraction: fractionSchema.optional(),
      targetNaturalGasShareFraction: fractionSchema.optional(),
      targetFuelOilShareFraction: fractionSchema.optional(),
      targetWoodShareFraction: fractionSchema.optional(),
      targetHeatNetworkShareFraction: fractionSchema.optional(),
    })
    .refine(
      (parameters) => sum(givenShares(parameters)).isLessThanOrEqualTo(TARGET_SHARES_TOTAL),
      {
        path: [],
        message: 'the target shares given must add up to at most 100%',
        when: ({ issues }) => issues.length === 0,
      },
    )
    .refine(
      (parameters) => {
        const shares = givenShares(parameters)
        return shares.length < TARGET_SHARE_COUNT || sum(shares).isEqualTo(TARGET_SHARES_TOTAL)
      },
      {
        path: ['targetHeatNetworkShareFraction'],
        message: 'the five target shares must add up to 100%',
        when: ({ issues }) => issues.length === 0,
      },
    ),
})

type ResidentielChangementSystemeChauffageRequestInput = z.input<
  typeof residentielChangementSystemeChauffageRequestSchema
>

type ResidentielChangementSystemeChauffageRequest = z.output<
  typeof residentielChangementSystemeChauffageRequestSchema
> & {
  readonly territory: {
    readonly level: ComputedLevels<'residentiel_changement_systeme_chauffage'>
  }
}

export { residentielChangementSystemeChauffageRequestSchema }
export type {
  ResidentielChangementSystemeChauffageRequest,
  ResidentielChangementSystemeChauffageRequestInput,
}
