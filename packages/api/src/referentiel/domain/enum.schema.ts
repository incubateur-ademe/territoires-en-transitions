import { z } from 'zod';

/**
 * Schéma zod de l'énum des référentiels
 */
export const referentielSchema = z.enum(['eci', 'cae', 'te', 'te-test']);

export type Referentiel = z.infer<typeof referentielSchema>;
