import { createPreuveReglementaireDefinitionSchema } from '@/backend/collectivites/documents/models/preuve-reglementaire-definition.table';
import { getZodStringArrayFromQueryString } from '@/backend/utils/zod.utils';
import z from 'zod';

export const importPreuveReglementaireDefinitionSchema =
  createPreuveReglementaireDefinitionSchema.extend({
    actions: getZodStringArrayFromQueryString(),
  });

export type ImportPreuveReglementaireDefinitionType = z.infer<
  typeof importPreuveReglementaireDefinitionSchema
>;
