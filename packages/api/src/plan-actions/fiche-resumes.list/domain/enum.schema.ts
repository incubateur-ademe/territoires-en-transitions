import {z} from 'zod';

/**
 * Schéma zod de l'énum des statuts d'une fiche action
 */
export const statutsSchema = z.enum([
  'À venir',
  'En cours',
  'Réalisé',
  'En pause',
  'Abandonné',
]);

/**
 * Schéma zod de l'énum des niveaux de priorités d'une fiche action
 */
export const niveauPrioritesSchema = z.enum(['Élevé', 'Moyen', 'Bas']);
