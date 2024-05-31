import {z} from "zod";

/**
 * Schéma zod de l'énum des référentiels
 */
export const referentielSchema = z.enum(['eci', 'cae']);
