import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import { sum } from '../../domain/big-number.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { ANIMAL_PARAMETERS } from './animal-parameters.ts'
import type { AnimalType } from './data/animal-types.ts'
import { ONE } from './emission-constants.ts'

const manureSharesSchema = z.strictObject({
  liquid: fractionSchema,
  solid: fractionSchema,
  pasture: fractionSchema,
  anaerobicDigestion: fractionSchema,
})

function hasNoIssue({ issues }: { issues: readonly unknown[] }): boolean {
  return issues.length === 0
}

function animalChangeSchema(animalType: AnimalType) {
  const parameters = ANIMAL_PARAMETERS[animalType]
  return z.strictObject({
    headcountReductionFraction: fractionSchema,
    entericEmissionReductionFraction: fractionSchema.optional(),
    targetManureShares: manureSharesSchema
      .refine(
        ({ liquid, solid, pasture, anaerobicDigestion }) =>
          sum([liquid, solid, pasture, anaerobicDigestion]).isEqualTo(ONE),
        { message: 'must add up to 100%', when: hasNoIssue },
      )
      .refine(
        ({ liquid }) => parameters.methaneConversionFactors.liquid !== undefined || liquid.isZero(),
        {
          path: ['liquid'],
          message: `liquid manure is not an available management mode for ${animalType}`,
          when: hasNoIssue,
        },
      )
      .refine(({ anaerobicDigestion }) => parameters.canBeDigested || anaerobicDigestion.isZero(), {
        path: ['anaerobicDigestion'],
        message: `anaerobic digestion has no emission factor for ${animalType}`,
        when: hasNoIssue,
      }),
  })
}

const elevageDurableRequestSchema = z.strictObject({
  id: z.literal('elevage_durable'),
  territory: territorySchema,
  parameters: z.strictObject({
    animals: z
      .strictObject({
        dairyCows: animalChangeSchema('dairyCows').optional(),
        otherCattle: animalChangeSchema('otherCattle').optional(),
        sows: animalChangeSchema('sows').optional(),
        otherPigs: animalChangeSchema('otherPigs').optional(),
        goats: animalChangeSchema('goats').optional(),
        sheep: animalChangeSchema('sheep').optional(),
        horses: animalChangeSchema('horses').optional(),
        mulesAndDonkeys: animalChangeSchema('mulesAndDonkeys').optional(),
        layingHens: animalChangeSchema('layingHens').optional(),
        broilers: animalChangeSchema('broilers').optional(),
        otherPoultry: animalChangeSchema('otherPoultry').optional(),
      })
      .refine((animals) => Object.values(animals).some((change) => change !== undefined), {
        message: 'must change at least one animal type',
        when: hasNoIssue,
      }),
  }),
})

type ElevageDurableRequestInput = z.input<typeof elevageDurableRequestSchema>

type ElevageDurableRequest = z.output<typeof elevageDurableRequestSchema> & {
  readonly territory: { readonly level: ComputedLevels<'elevage_durable'> }
}

export { elevageDurableRequestSchema }
export type { ElevageDurableRequest, ElevageDurableRequestInput }
