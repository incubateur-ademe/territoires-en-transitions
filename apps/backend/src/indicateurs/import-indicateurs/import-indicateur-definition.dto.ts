import { getZodStringArrayFromQueryString } from '@tet/backend/utils/zod.utils';
import {
  indicateurDefinitionSchema,
  IndicateurPeriodiciteEnum,
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

  // Le stockage annuel refuse une périodicité explicite qu'il ne peut conserver.
  periodicite: z.optional(z.literal(IndicateurPeriodiciteEnum.ANNUELLE)),
  identifiantReferentiel: z.string(), // Mandatory in this case
  parents: getZodStringArrayFromQueryString().nullable().optional(),
  categories: getZodStringArrayFromQueryString().nullable().optional(),
  thematiques: getZodStringArrayFromQueryString().nullable().optional(),
});

export type ImportIndicateurDefinitionType = z.infer<
  typeof importIndicateurDefinitionSchema
>;
