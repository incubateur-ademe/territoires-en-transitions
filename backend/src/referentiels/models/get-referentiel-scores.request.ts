import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { ScoreJalon } from './score-jalon.enum';

export const getReferentielScoresRequestSchema = extendApi(
  z.object({
    date: z
      .string()
      .datetime()
      .optional()
      .describe(
        `Date de référence pour obtenir les scores des actions à partir des réponses de personnalisation et des statuts des actions à cette date. Par défaut, la date actuelle sauf si un jalon est spécifié`
      ),

    avecReferentielsOrigine: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .optional()
      .describe(
        `Indique si les scores des actions doivent être calculés à partir des avancement dans les référentiels d'origine. Utilisé pour le bac à sable lors de la création de nouveaux référentiels à partir de référentiels existants`
      ),

    jalon: z
      .nativeEnum(ScoreJalon)
      .optional()
      .describe(
        `Définit la date par rapport à un jalon spécifique. Prioritaire par rapport à la date. Peut être complété par anneeAudit pour spécifier un audit spécifique`
      ),
    anneeAudit: z
      .string()
      .pipe(z.coerce.number().int())
      .refine(
        (val) => `${val}`.length === 4,
        'anneeAudit doit être une année au format YYYY'
      )
      .optional()
      .describe(`Année de l'audit pour le jalon`),
  })
).openapi({
  title:
    'Paramètres de la requête pour obtenir les scores des actions dun référentiel',
});
export type GetReferentielScoresRequestType = z.infer<
  typeof getReferentielScoresRequestSchema
>;
