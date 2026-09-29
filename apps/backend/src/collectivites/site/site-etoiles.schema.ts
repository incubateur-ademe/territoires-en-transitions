import { z } from 'zod';

/**
 * Nombre d'étoiles affiché par le site. Contrairement à `etoileEnumSchema`
 * (1 à 5), l'historique de labellisation contient des lignes à 0 étoile.
 */
export const siteEtoilesSchema = z.literal([0, 1, 2, 3, 4, 5]);
