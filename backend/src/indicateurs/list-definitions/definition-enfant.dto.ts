import { indicateurDefinitionSchema } from '@/backend/indicateurs/shared/models/indicateur-definition.table';
import z from 'zod';

export const indicateurDefinitionEnfantDtoSchema =
  indicateurDefinitionSchema.pick({
    id: true,
    identifiantReferentiel: true,
    titre: true,
    titreCourt: true,
  });

export type IndicateurDefinitionEnfantDto = z.infer<
  typeof indicateurDefinitionEnfantDtoSchema
>;
