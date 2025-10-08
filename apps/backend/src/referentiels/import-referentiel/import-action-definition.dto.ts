import {
  ActionCategorieEnum,
  actionDefinitionSchemaInsert,
} from '@/backend/referentiels/models/action-definition.table';
import { getZodStringArrayFromQueryString } from '@/backend/utils/zod.utils';
import z from 'zod';

export enum ImportActionDefinitionCoremeasureType {
  COREMEASURE = 'coremeasure',
}

export const importActionDefinitionSchema = actionDefinitionSchemaInsert
  .partial({
    actionId: true,
    description: true,
    nom: true,
    contexte: true,
    exemples: true,
    ressources: true,
    referentiel: true,
    referentielId: true,
    referentielVersion: true,
    reductionPotentiel: true,
    perimetreEvaluation: true,
    exprScore: true,
  })
  .extend({
    categorie: z
      .string()
      .toLowerCase()
      .pipe(z.nativeEnum(ActionCategorieEnum))
      .optional(),
    origine: z.string().optional(),
    labels: getZodStringArrayFromQueryString().optional(),
    coremeasure: z.string().optional(),
    /* Lien vers les indicateurs */
    indicateurs: getZodStringArrayFromQueryString().nullable().optional(),
    /* Lien vers les questions de personnalisation pour pouvoir remplir les réponses depuis les sous-mesures */
    personnalisationQuestions: getZodStringArrayFromQueryString()
      .nullable()
      .optional(),
    /** règles de personnalisation */
    desactivation: z.string().optional(),
    desactivationDesc: z.string().optional(),
    score: z.string().optional(),
    scoreDesc: z.string().optional(),
    reduction: z.string().optional(),
    reductionDesc: z.string().optional(),
  });

export type ImportActionDefinitionType = z.infer<
  typeof importActionDefinitionSchema
>;
