import { z } from 'zod';
import { SnapshotJalonEnum } from '../snapshots/snapshot-jalon.enum';

export const getReferentielScoresRequestSchema = z
  .object({
    date: z.iso
      .datetime()
      .optional()
      .describe(
        `Date de référence pour obtenir les scores des actions à partir des réponses de personnalisation et des statuts des actions à cette date. Par défaut, la date actuelle sauf si un jalon est spécifié`
      ),

    avecReferentielsOrigine: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(
        `Indique si les scores des actions doivent être calculés à partir des avancement dans les référentiels d'origine. Utilisé pour le bac à sable lors de la création de nouveaux référentiels à partir de référentiels existants`
      ),
    jalon: z
      .enum(SnapshotJalonEnum)
      .optional()
      .describe(
        `Définit la date par rapport à un jalon spécifique. Prioritaire par rapport à la date. Peut être complété par anneeAudit pour spécifier un audit spécifique`
      ),
    auditId: z.coerce
      .number()
      .optional()
      .describe(`Identifiant de l'audit pour le jalon`),
    anneeAudit: z
      .string()
      .transform((value) => z.coerce.number().int().parse(value))
      .refine(
        (val) => `${val}`.length === 4,
        'anneeAudit doit être une année au format YYYY'
      )
      .optional()
      .describe(`Année de l'audit pour le jalon`),
    snapshot: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(
        `Indique si le score doit être sauvegardé. Si c'est le cas, l'utilisateur doit avoir le droit d'écriture sur la collectivité`
      ),
    snapshotNom: z
      .string()
      .optional()
      .describe(
        `Nom du snapshot de score à sauvegarder. Ne peut être défini que pour une date personnalisée, sinon un nom par défaut est utilisé`
      ),
    snapshotForceUpdate: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`Force l'update du snapshot même si il existe déjà`),
  })
  .describe(
    'Paramètres de la requête pour obtenir les scores des actions dun référentiel'
  );
export type GetReferentielScoresRequestType = z.infer<
  typeof getReferentielScoresRequestSchema
>;
