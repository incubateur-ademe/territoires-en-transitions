
import { indicateurPiloteSchemaUpsert } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import z from 'zod';



export const upsertIndicateurDefinitionPiloteRequestSchema = indicateurPiloteSchemaUpsert;

export type UpsertIndicateurDefinitionPiloteRequest = z.infer<typeof indicateurPiloteSchemaUpsert>;
