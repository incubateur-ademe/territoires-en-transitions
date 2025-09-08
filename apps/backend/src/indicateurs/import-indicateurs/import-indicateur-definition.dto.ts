import { getZodStringArrayFromQueryString } from '@/backend/utils/zod.utils';
import { z } from 'zod';
import { indicateurDefinitionSchema } from '../definitions/indicateur-definition.table';

export const importIndicateurDefinitionSchema = indicateurDefinitionSchema
  .omit({
    modifiedAt: true,
    modifiedBy: true,
    createdAt: true,
    createdBy: true,
    id: true,
    groupementId: true,
    collectiviteId: true,
  })
  .extend({
    identifiantReferentiel: z.string(), // Mandatory in this case
    parents: getZodStringArrayFromQueryString().nullable().optional(),
    categories: getZodStringArrayFromQueryString().nullable().optional(),
    thematiques: getZodStringArrayFromQueryString().nullable().optional(),
  });

export type ImportIndicateurDefinitionType = z.infer<
  typeof importIndicateurDefinitionSchema
>;
