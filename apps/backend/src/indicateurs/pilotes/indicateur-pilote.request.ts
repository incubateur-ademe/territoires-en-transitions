
import { indicateurPiloteSchemaUpsert } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import z from 'zod';



export const upsertIndicateurPiloteRequestSchema = indicateurPiloteSchemaUpsert;

export type UpsertIndicateurPiloteRequest = z.infer<typeof indicateurPiloteSchemaUpsert>;
