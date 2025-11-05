import { getZodStringArrayFromQueryString } from '@/backend/utils/zod.utils';
import { preuveReglementaireDefinitionSchema } from '@/domain/collectivites';
import z from 'zod';

export const importPreuveReglementaireDefinitionSchema = z.object({
  ...preuveReglementaireDefinitionSchema.shape,
  actions: getZodStringArrayFromQueryString(),
});

export type ImportPreuveReglementaireDefinition = z.infer<
  typeof importPreuveReglementaireDefinitionSchema
>;
