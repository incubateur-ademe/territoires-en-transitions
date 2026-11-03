import { getZodStringArrayFromQueryString } from '@tet/backend/utils/zod.utils';
import {
  IndicateurPeriodiciteEnum,
  indicateurCommonSchema,
} from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const importIndicateurDefinitionSchema = z.object({
  ...z.omit(indicateurCommonSchema, {
    modifiedAt: true,
    modifiedBy: true,
    createdAt: true,
    createdBy: true,
    id: true,
    periodicite: true,
  }).shape,

  identifiantReferentiel: z.string(), // Mandatory in this case
  periodicite: z._default(
    indicateurCommonSchema.shape.periodicite,
    IndicateurPeriodiciteEnum.ANNUELLE
  ),
  parents: getZodStringArrayFromQueryString().nullable().optional(),
  categories: getZodStringArrayFromQueryString().nullable().optional(),
  thematiques: getZodStringArrayFromQueryString().nullable().optional(),
});

export type ImportIndicateurDefinitionType = z.infer<
  typeof importIndicateurDefinitionSchema
>;
