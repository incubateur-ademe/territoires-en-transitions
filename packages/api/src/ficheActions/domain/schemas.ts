import {z} from 'zod';

export const statuts = z.enum([
  'À venir',
  'En cours',
  'Réalisé',
  'En pause',
  'Abandonné',
]);

export const niveauPriorites = z.enum(['Élevé', 'Moyen', 'Bas']);
