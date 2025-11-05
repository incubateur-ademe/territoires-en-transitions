import * as z from 'zod/mini';

export const StatutEnum = {
  A_VENIR: 'À venir',
  EN_COURS: 'En cours',
  REALISE: 'Réalisé',
  EN_PAUSE: 'En pause',
  ABANDONNE: 'Abandonné',
  BLOQUE: 'Bloqué',
  EN_RETARD: 'En retard',
  A_DISCUTER: 'A discuter',
} as const;

export const statutEnumValues = [
  StatutEnum.A_VENIR,
  StatutEnum.EN_COURS,
  StatutEnum.REALISE,
  StatutEnum.EN_PAUSE,
  StatutEnum.ABANDONNE,
  StatutEnum.BLOQUE,
  StatutEnum.EN_RETARD,
  StatutEnum.A_DISCUTER,
] as const;

export const statutEnumSchema = z.enum(statutEnumValues);
export type Statut = z.infer<typeof statutEnumSchema>;
