import { z } from 'zod';

/**
 * Le niveau du document qui devient l'action : la fiche (« Fiche action
 * n°1.2 »), ses étapes (« Action 1 – … ») devenant des sous-actions ; ou
 * l'étape, la fiche devenant un sous-axe.
 */
export const actionLevelValues = ['fiche', 'etape'] as const;
export const actionLevelSchema = z.enum(actionLevelValues);
export type ActionLevel = z.output<typeof actionLevelSchema>;

const documentLevelSchema = z.object({
  /** Un titre réel du document à ce niveau. */
  exampleTitle: z.string(),
  /** Page affichée, à partir de 1. */
  examplePage: z.number().int().positive(),
  count: z.number().int().nonnegative(),
});

export const actionLevelDoubtSchema = z.object({
  kind: z.literal('action-level'),
  axes: documentLevelSchema.nullable(),
  fiches: documentLevelSchema,
  /** Les fiches qui détaillent des étapes : lues à l'étape, elles deviennent des sous-axes. */
  fichesWithEtapes: z.number().int().nonnegative(),
  etapes: documentLevelSchema,
  proposed: actionLevelSchema,
});

export type ActionLevelDoubt = z.output<typeof actionLevelDoubtSchema>;

/**
 * La précision demandée avant de créer le plan. Une seule sorte de question
 * pour l'instant ; d'autres doutes viendront s'ajouter à l'union.
 */
export const importQuestionSchema = z.discriminatedUnion('kind', [
  actionLevelDoubtSchema.extend({
    answer: z
      .object({
        actionLevel: actionLevelSchema,
        answeredBy: z.string(),
        answeredAt: z.string(),
      })
      .nullable(),
  }),
]);

export type ImportQuestion = z.output<typeof importQuestionSchema>;

export const importAnswerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('action-level'), actionLevel: actionLevelSchema }),
]);

export type ImportAnswer = z.output<typeof importAnswerSchema>;
