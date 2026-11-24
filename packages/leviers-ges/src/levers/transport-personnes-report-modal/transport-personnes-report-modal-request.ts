import { z } from 'zod'
import { fractionSchema, territorySchema } from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { quantity, type Fraction } from '../../domain/units.ts'

// Source : ParametreDeterminants, lignes « % VP vers TC » et « % VP vers actif » : « Le report modal total doit être inférieur à 100% »
const TOTAL_MODAL_SHIFT_CEILING: Fraction = quantity<'Fraction'>('1')

const transportPersonnesReportModalRequestSchema = z.strictObject({
  id: z.literal('transport_personnes_report_modal'),
  territory: territorySchema,
  parameters: z
    .strictObject({
      carToPublicTransportFraction: fractionSchema,
      carToActiveModesFraction: fractionSchema,
      publicTransportToActiveModesFraction: fractionSchema,
      railShareFraction: fractionSchema.optional(),
    })
    .refine(
      ({ carToPublicTransportFraction, carToActiveModesFraction }) => {
        const totalModalShift = carToPublicTransportFraction.plus(carToActiveModesFraction)
        return totalModalShift.isLessThanOrEqualTo(TOTAL_MODAL_SHIFT_CEILING)
      },
      {
        path: ['carToActiveModesFraction'],
        message: 'must be at most 100% together with carToPublicTransportFraction',
        when: ({ issues }) => issues.length === 0,
      },
    ),
})

type TransportPersonnesReportModalRequestInput = z.input<
  typeof transportPersonnesReportModalRequestSchema
>

type TransportPersonnesReportModalRequest = z.output<
  typeof transportPersonnesReportModalRequestSchema
> & {
  readonly territory: { readonly level: ComputedLevels<'transport_personnes_report_modal'> }
}

export { transportPersonnesReportModalRequestSchema }
export type { TransportPersonnesReportModalRequest, TransportPersonnesReportModalRequestInput }
