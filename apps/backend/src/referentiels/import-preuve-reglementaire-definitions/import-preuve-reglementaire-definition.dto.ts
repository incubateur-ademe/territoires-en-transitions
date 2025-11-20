import { getZodStringArrayFromQueryString } from '@tet/backend/utils/zod.utils';
import { preuveReglementaireDefinitionSchema } from '@tet/domain/collectivites';
import z from 'zod';

export const importPreuveReglementaireDefinitionSchema = z.object({
  ...preuveReglementaireDefinitionSchema.shape,
  actions: getZodStringArrayFromQueryString(),
});

export type ImportPreuveReglementaireDefinition = z.infer<
  typeof importPreuveReglementaireDefinitionSchema
>;
