
import { indicateurServiceTagSchema } from '@/backend/indicateurs/shared/models/indicateur-service-tag.table';
import z from 'zod';



export const upsertIndicateurDefinitionServiceTagRequestSchema = indicateurServiceTagSchema;

export type UpsertIndicateurDefinitionServiceTagRequest = z.infer<typeof upsertIndicateurDefinitionServiceTagRequestSchema>;

export type IndicateurDefinitionServiceTag = {
  nom: string;
  indicateurId: number;
  serviceTagId: number;
  collectiviteId: number;
};
