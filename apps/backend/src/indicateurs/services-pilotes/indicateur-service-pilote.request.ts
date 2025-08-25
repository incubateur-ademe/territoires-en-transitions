
import { indicateurServiceTagSchema } from '@/backend/indicateurs/shared/models/indicateur-service-tag.table';
import z from 'zod';



export const upsertIndicateurServicePiloteRequestSchema = indicateurServiceTagSchema;

export type UpsertIndicateurServicePiloteRequest = z.infer<typeof upsertIndicateurServicePiloteRequestSchema>;
