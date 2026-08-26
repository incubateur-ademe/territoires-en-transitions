import { actionScoreWithOnlyPointsSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { corelatedActionWithScoreSchema } from './referentiel-action-origine-with-score.dto';
import { correlatedActionSchema } from './referentiel-action-origine.dto';
import { correlatedActionTexteSchema } from './referentiel-action-origine-texte.dto';

export const correlatedActionsFieldsSchema = z.object({
  referentielsOrigine: z.string().array().optional(),
  actionsOrigine: correlatedActionSchema.array().optional(),
  /** liens complémentaires (sans pondération) réservés à la fusion des commentaires lors de la bascule TE */
  actionsOrigineTexte: correlatedActionTexteSchema.array().optional(),
});

export type CorrelatedActionsFields = z.infer<
  typeof correlatedActionsFieldsSchema
>;

export const correlatedActionsWithScoreFieldsSchema = z.object({
  referentielsOrigine: z.string().array().optional(),
  actionsOrigine: corelatedActionWithScoreSchema.array().optional(),
  scoresOrigine: z
    .record(z.string(), actionScoreWithOnlyPointsSchema.nullable())
    .optional(),
});

export type CorrelatedActionsWithScoreFields = z.infer<
  typeof correlatedActionsWithScoreFieldsSchema
>;
