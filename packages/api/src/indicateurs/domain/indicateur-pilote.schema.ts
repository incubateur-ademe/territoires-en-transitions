import {
  upsertIndicateurPiloteRequestSchema
} from '@/domain/indicateurs';
import { z } from 'zod';

/**
 * Schéma zod d'un indicateur pilote
 */
export const indicateurPiloteRequestSchema = upsertIndicateurPiloteRequestSchema;

/**
 * Type TS d'un indicateur pilote
 */
export type IndicateurPiloteRequestSchema = z.input<typeof indicateurPiloteRequestSchema>;

