import z from 'zod';

/** Type de modification enregistrée dans l'historique */
export const historiqueTypeEnumValues = [
  'action_statut',
  'action_precision',
  'reponse',
  'justification',
] as const;

export const historiqueTypeSchema = z.enum(historiqueTypeEnumValues);

export type HistoriqueType = (typeof historiqueTypeEnumValues)[number];
