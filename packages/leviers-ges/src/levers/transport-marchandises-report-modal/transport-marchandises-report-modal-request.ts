import { z } from 'zod'
import {
  fractionSchema,
  nonNegativeTonneKilometresSchema,
  territorySchema,
} from '../../application/estimate/shared-schemas.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { quantity, type Fraction } from '../../domain/units.ts'

// Source : choix de conception, non validé : le tableur ne borne pas la somme des reports de marchandises (ParametreDeterminants!H24:H25 vides) alors qu'il la borne à moins de 100 % pour les personnes (H34:H35)
const TOTAL_FREIGHT_SHIFT_CEILING: Fraction = quantity<'Fraction'>('1')

const transportMarchandisesReportModalRequestSchema = z.strictObject({
  id: z.literal('transport_marchandises_report_modal'),
  territory: territorySchema,
  parameters: z
    .strictObject({
      roadToRailFraction: fractionSchema,
      roadToWaterwayFraction: fractionSchema,
      cyclologisticTonneKilometres: nonNegativeTonneKilometresSchema.optional(),
    })
    .refine(
      ({ roadToRailFraction, roadToWaterwayFraction }) => {
        const totalShift = roadToRailFraction.plus(roadToWaterwayFraction)
        return totalShift.isLessThanOrEqualTo(TOTAL_FREIGHT_SHIFT_CEILING)
      },
      {
        path: ['roadToWaterwayFraction'],
        message: 'must be at most 100% together with roadToRailFraction',
        when: ({ issues }) => issues.length === 0,
      },
    ),
})

type TransportMarchandisesReportModalRequestInput = z.input<
  typeof transportMarchandisesReportModalRequestSchema
>

type TransportMarchandisesReportModalRequest = z.output<
  typeof transportMarchandisesReportModalRequestSchema
> & {
  readonly territory: {
    readonly level: ComputedLevels<'transport_marchandises_report_modal'>
  }
}

export { transportMarchandisesReportModalRequestSchema }
export type {
  TransportMarchandisesReportModalRequest,
  TransportMarchandisesReportModalRequestInput,
}
