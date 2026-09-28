import { z } from 'zod';

export const indicateurVueNomSchema = z
  .string()
  .trim()
  .min(1, 'Le titre de la vue est obligatoire.')
  .max(100, 'Le titre de la vue ne peut pas dépasser 100 caractères.');
