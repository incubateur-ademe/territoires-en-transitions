import { z } from 'zod';
import { collectiviteAvecTypeSchema } from '../../collectivites/identite-collectivite.dto';
import { actionDefinitionSchema } from '../index-domain';
import {
  actionDefinitionEssentialSchema,
  treeNodeSchema,
} from '../models/action-definition.dto';
import { ComputeScoreMode } from '../models/compute-scores-mode.enum';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import { snapshotJalonEnumSchema } from '../snapshots/snapshot.table';
import { scoreFinalFieldsSchema } from './score.dto';

export const getReferentielScoresResponseSnapshotInfoSchema = z.object({
  ref: z.string(),
  nom: z.string(),
  createdAt: z.string().datetime(),
  createdBy: z.string().nullable(),
  modifiedAt: z.string().datetime(),
  modifiedBy: z.string().nullable(),
});

export const getReferentielScoresResponseSchema = z
  .object({
    collectiviteId: z.number(),
    referentielId: referentielIdEnumSchema,
    referentielVersion: z.string(),
    collectiviteInfo: collectiviteAvecTypeSchema,
    date: z.string().datetime(),
    scores: treeNodeSchema(
      actionDefinitionSchema
        .pick({ identifiant: true, nom: true, categorie: true })
        .merge(actionDefinitionEssentialSchema)
        .merge(scoreFinalFieldsSchema)
    ),
    jalon: snapshotJalonEnumSchema,
    auditId: z.number().optional(),
    anneeAudit: z.number().optional(),
    snapshot: getReferentielScoresResponseSnapshotInfoSchema.optional(),
    mode: z.nativeEnum(ComputeScoreMode),
  })
  .describe('Score de la collectivité pour un référentiel et la date donnée');

export type GetReferentielScoresResponseType = z.infer<
  typeof getReferentielScoresResponseSchema
>;
