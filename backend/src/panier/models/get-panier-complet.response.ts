import {
  actionImpactSnippetSchema,
  ActionImpactSnippetType,
  actionImpactTransformeSchema,
  ActionImpactTransformeType,
} from './action-impact.table';
import {
  actionImpactStatutSchema,
  ActionImpactStatutType,
} from './action-impact-statut.table';
import {
  thematiqueSchema,
  ThematiqueType,
} from '../../taxonomie/models/thematique.table';
import { panierSchema, PanierType } from './panier.table';
import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export type ActionImpactStateType = {
  action: ActionImpactTransformeType;
  isinpanier: boolean;
  statut: ActionImpactStatutType | null;
  thematiques: ThematiqueType[];
};

export const actionImpactStateSchema = extendApi(
  z.object({
    action: actionImpactTransformeSchema,
    isinpanier: z.boolean(),
    statut: actionImpactStatutSchema.nullable(),
    thematiques: z.array(thematiqueSchema),
  }),
);

export type PanierCompletType =
  /* Le panier en tant que tel */
  PanierType & {
    /* Liste des actions ajoutée au panier */
    contenu: ActionImpactSnippetType[];
    /* Liste de toutes les actions avec leurs states. */
    states: ActionImpactStateType[];
  };

export const panierCompletSchema = extendApi(
  panierSchema
    .extend({
      contenu: z.array(actionImpactSnippetSchema),
      states: z.array(actionImpactStateSchema),
    })
    .openapi({
      title: `Panier d'une collectivité avec son contenu.`,
    }),
);

export class PanierCompletClass extends createZodDto(panierCompletSchema) {}
