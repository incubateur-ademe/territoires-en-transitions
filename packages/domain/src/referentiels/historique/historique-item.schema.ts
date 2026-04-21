import z from 'zod';
import { statutAvancementEnumSchema } from '../actions/action-statut-avancement.enum.schema';
import { actionTypeSchema } from '../actions/action-type.enum';

/**
 * Shape d'une ligne de l'historique renvoyée par `referentiels.historique.list`.
 *
 * Le flux fédère 4 sources (statut d'action, précision d'action, réponse de
 * personnalisation, justification). Plutôt qu'un objet plat où la majorité des
 * colonnes sont structurellement nulles selon le `type` de la ligne, on
 * expose une union discriminée Zod sur le champ `type` : chaque variante ne
 * porte que les champs sémantiquement pertinents pour son type.
 *
 * Les types narrowés `HistoriqueActionStatutItem`, `HistoriqueActionPrecisionItem`,
 * `HistoriqueReponseItem` et `HistoriqueJustificationItem` sont exportés pour
 * permettre aux consommateurs de typer leurs props sur la variante attendue.
 */

const baseFields = {
  collectiviteId: z.number(),
  modifiedById: z.string(),
  modifiedByNom: z.string().nullable(),
  modifiedAt: z.string(),
  previousModifiedById: z.string().nullable(),
  previousModifiedAt: z.string().nullable(),
  actionIds: z.string().array().nullable(),
} as const;

const actionFields = {
  actionId: z.string(),
  actionType: actionTypeSchema.nullable(),
  actionIdentifiant: z.string().nullable(),
  actionNom: z.string().nullable(),
  tacheIdentifiant: z.string().nullable(),
  tacheNom: z.string().nullable(),
} as const;

const questionFields = {
  questionId: z.string(),
  questionFormulation: z.string().nullable(),
  thematiqueId: z.string().nullable(),
  thematiqueNom: z.string().nullable(),
} as const;

export const historiqueActionStatutItemSchema = z.object({
  type: z.literal('action_statut'),
  ...baseFields,
  ...actionFields,
  avancement: statutAvancementEnumSchema.nullable(),
  previousAvancement: statutAvancementEnumSchema.nullable(),
  avancementDetaille: z.number().array().nullable(),
  previousAvancementDetaille: z.number().array().nullable(),
  concerne: z.boolean().nullable(),
  previousConcerne: z.boolean().nullable(),
});

export const historiqueActionPrecisionItemSchema = z.object({
  type: z.literal('action_precision'),
  ...baseFields,
  ...actionFields,
  precision: z.string().nullable(),
  previousPrecision: z.string().nullable(),
});

export const historiqueReponseItemSchema = z.object({
  type: z.literal('reponse'),
  ...baseFields,
  ...questionFields,
  questionType: z.string(),
  // `reponse` contient un JSON libre. On garde `.optional()` (et non
  // `.nullable()`) pour que l'inférence tRPC (`reponse?: unknown`) reste
  // stable côté front : Zod 4 marque la clé `z.unknown()` comme optionnelle
  // dans le type inféré, et la combinaison avec `.nullable()` rend les types
  // divergents entre serveur et client.
  reponse: z.unknown().optional(),
  previousReponse: z.unknown().optional(),
  // Justification courante au moment du changement de réponse (subquery côté
  // service) — pas de `previousJustification` sur cette variante.
  justification: z.string().nullable(),
});

export const historiqueJustificationItemSchema = z.object({
  type: z.literal('justification'),
  ...baseFields,
  ...questionFields,
  questionType: z.string().nullable(),
  // Réponse courante au moment du changement de justification (subquery côté
  // service) — pas de `previousReponse` sur cette variante.
  reponse: z.unknown().optional(),
  justification: z.string().nullable(),
  previousJustification: z.string().nullable(),
});

export const historiqueItemSchema = z.discriminatedUnion('type', [
  historiqueActionStatutItemSchema,
  historiqueActionPrecisionItemSchema,
  historiqueReponseItemSchema,
  historiqueJustificationItemSchema,
]);

export type HistoriqueItem = z.infer<typeof historiqueItemSchema>;
export type HistoriqueActionStatutItem = z.infer<
  typeof historiqueActionStatutItemSchema
>;
export type HistoriqueActionPrecisionItem = z.infer<
  typeof historiqueActionPrecisionItemSchema
>;
export type HistoriqueReponseItem = z.infer<typeof historiqueReponseItemSchema>;
export type HistoriqueJustificationItem = z.infer<
  typeof historiqueJustificationItemSchema
>;
