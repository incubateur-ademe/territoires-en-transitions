import {
  annualReleasePeriodiciteSchema,
  annualReleaseAggregationSchema,
} from '../definitions/indicateur-annual-release.input';
import { getZodStringArrayFromQueryString } from '@tet/backend/utils/zod.utils';
import { indicateurDefinitionSchema } from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const importIndicateurDefinitionSchema = z.object({
  ...z.omit(indicateurDefinitionSchema, {
    modifiedAt: true,
    modifiedBy: true,
    createdAt: true,
    createdBy: true,
    id: true,
    periodicite: true,
    aggregationResultat: true,
    aggregationObjectif: true,

    groupementId: true,
    collectiviteId: true,
  }).shape,

  identifiantReferentiel: z.string(), // Mandatory in this case
  periodicite: z._default(annualReleasePeriodiciteSchema, 'annuelle'),
  aggregationResultat: z.optional(annualReleaseAggregationSchema),
  aggregationObjectif: z.optional(annualReleaseAggregationSchema),
  parents: getZodStringArrayFromQueryString().nullable().optional(),
  categories: getZodStringArrayFromQueryString().nullable().optional(),
  thematiques: getZodStringArrayFromQueryString().nullable().optional(),
});

export type ImportIndicateurDefinitionType = z.infer<
  typeof importIndicateurDefinitionSchema
>;
