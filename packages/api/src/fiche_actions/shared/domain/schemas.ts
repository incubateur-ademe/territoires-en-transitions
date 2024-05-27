import {z} from 'zod';

export const statutsSchema = z.enum([
  'À venir',
  'En cours',
  'Réalisé',
  'En pause',
  'Abandonné',
]);

export const niveauPrioritesSchema = z.enum(['Élevé', 'Moyen', 'Bas']);
