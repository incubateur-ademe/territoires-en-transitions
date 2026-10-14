import { getZodStringArrayFromQueryString } from '@tet/backend/utils/zod.utils';
import {
  IndicateurPeriodiciteEnum,
  indicateurDefinitionSchema,
} from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const importIndicateurDefinitionSchema = z.object({
  ...z.omit(indicateurDefinitionSchema, {
    modifiedAt: true,
    modifiedBy: true,
    createdAt: true,
    createdBy: true,
    id: true,
    periodicite: true,

    groupementId: true,
    collectiviteId: true,
  }).shape,

  identifiantReferentiel: z.string(), // Mandatory in this case
  periodicite: z._default(
    indicateurDefinitionSchema.shape.periodicite,
    IndicateurPeriodiciteEnum.ANNUELLE
  ),
  parents: getZodStringArrayFromQueryString().nullable().optional(),
  categories: getZodStringArrayFromQueryString().nullable().optional(),
  thematiques: getZodStringArrayFromQueryString().nullable().optional(),
});

export type ImportIndicateurDefinitionType = z.infer<
  typeof importIndicateurDefinitionSchema
>;
