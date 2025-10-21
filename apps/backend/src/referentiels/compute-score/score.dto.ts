import { z } from 'zod';
import { statutAvancementEnumValues } from '../models/action-statut.table';
import { ScoreIndicatifPayload } from '../models/score-indicatif.dto';

export const scoreSchema = z
  .object({
    actionId: z.string().describe("L'id de l'action, ex: eci_1.1"),
    explication: z
      .string()
      .optional()
      .describe("Explication/justification du statut de l'action"),

    etoiles: z
      .number()
      .optional()
      .describe(
        "Le nombre d'étoiles correspondant à des seuils de score en pourcentage"
      ),

    pointReferentiel: z
      .number()
      .nullable()
      .describe(
        'La valeur de base du potentiel initial tel que calculé à partir des markdowns'
      ),
    pointPotentiel: z
      .number()
      .nullable()
      .describe(
        'Le potentiel est calculé à partir des conséquences de la personnalisation, soit point référentiel x facteur de la personnalisation. Valeur identique à `point_referentiel` si pas de modification. Potentiel éventuellement réduit ou augmenté par le statut non concerné ou la personnalisation.'
      ),
    pointPotentielPerso: z
      .number()
      .nullable()
      .describe(
        'Le potentiel personnalisé est calculé à partir du potentiel, auquel on ajoute le reliquat des points des actions désactivées. Potentiel éventuellement réduit ou augmenté par la personnalisation. `null` si pas de modification.'
      ),

    pointFait: z
      .number()
      .nullable()
      .describe(
        'Pour une tache avec un statut fait, est égal au point référentiel'
      ),
    pointPasFait: z
      .number()
      .nullable()
      .describe(
        'Pour une tache avec un statut pas fait, est égal au point référentiel'
      ),
    pointProgramme: z
      .number()
      .nullable()
      .describe(
        'Pour une tache avec un statut programmé, est égal au point référentiel'
      ),
    pointNonRenseigne: z
      .number()
      .nullable()
      .describe('Pour une tache sans statut, est égal au point référentiel'),

    totalTachesCount: z.int()
      .describe(
        "Le nombre de taches d'une action, est égal à 1 si l'action est une tache"
      ),
    completedTachesCount: z.int()
      .nullable()
      .describe('Le nombre de taches renseignées'),

    faitTachesAvancement: z
      .number()
      .nullable()
      .describe(
        'La somme des proportions du statut `fait` des tâches, si une tache à un statut fait à 50% est égal à 0.5'
      ),
    programmeTachesAvancement: z
      .number()
      .nullable()
      .describe(
        'La somme des proportions du statut `programmé` des tâches, si une tache à un statut programmé à 50% est égal à 0.5'
      ),
    pasFaitTachesAvancement: z
      .number()
      .nullable()
      .describe(
        'La somme des proportions du statut `pas fait` des tâches, si une tache à un statut pas fait à 50% est égal à 0.5'
      ),
    pasConcerneTachesAvancement: z
      .number()
      .nullable()
      .describe(
        'La somme du statut `non concerné` des tâches. Si une tache est déclarée non concerné, est égal à 1.0'
      ),

    concerne: z
      .boolean()
      .describe(
        "Faux si la collectivité s'est déclarée comme non concernée pour cette action ou pour tous ses enfants. A noter qu'une désactivation par personnalisation entraine également un non concerné"
      ),

    desactive: z
      .boolean()
      .describe(
        "Vrai si l'action ou un de ses ancêtres est désactivé du fait de la personnalisation"
      ),
    aStatut: z
      .boolean()
      .optional()
      .describe(
        'Vrai si un statut a été renseigné pour cette action (sous-action ou tache)'
      ),
    avancement: z
      .enum(statutAvancementEnumValues)
      .optional()
      .describe("Avancement de l'action"),
    renseigne: z
      .boolean()
      .describe(
        "Vrai si l'action est renseignée, càd non manquante à la complétion du référentiel. Tag défini en fonction du statut de l'action et de celui de ses parents"
      ),
  })
  .describe(
    "Le score d'une action. Une action est un nœud de l'arbre constituant le référentiel. Son score représente les points obtenus ainsi que la valeur de l'action."
  );

export type Score = z.infer<typeof scoreSchema>;

//
// Schema indexed by actionId
export const scoresByActionId = z
  .record(z.string(), scoreSchema)
  .describe('Scores des actions par actionId');

export type ScoresByActionId = z.infer<typeof scoresByActionId>;

//
// Variation of the schema with only the points
export const scoreWithOnlyPointsSchema = scoreSchema.pick({
  pointFait: true,
  pointNonRenseigne: true,
  pointPasFait: true,
  pointPotentiel: true,
  pointProgramme: true,
  pointReferentiel: true,
  etoiles: true,
});

export type ScoreWithOnlyPoints = z.infer<typeof scoreWithOnlyPointsSchema>;

//
// Variation of the schema with only the points and the statuts
export const scoreWithOnlyPointsAndStatutsSchema = scoreSchema.pick({
  pointFait: true,
  pointNonRenseigne: true,
  pointPasFait: true,
  pointPotentiel: true,
  pointProgramme: true,
  pointReferentiel: true,
  etoiles: true,
  totalTachesCount: true,
  faitTachesAvancement: true,
  programmeTachesAvancement: true,
  pasFaitTachesAvancement: true,
  pasConcerneTachesAvancement: true,
});
export type ScoreWithOnlyPointsAndStatuts = z.infer<
  typeof scoreWithOnlyPointsAndStatutsSchema
>;

//
// Variation of the schema with `nullable` not allowed for points and statuts.
// Useful while returning the score after the computing of all those fields.
export const scoreFinalSchema = scoreSchema.extend({
  pointReferentiel: scoreSchema.shape.pointReferentiel.unwrap(),
  pointPotentiel: scoreSchema.shape.pointPotentiel.unwrap(),
  // We omit volontarily `pointPotentielPerso` because it is not always computed (when there is no personnalisation)
  pointFait: scoreSchema.shape.pointFait.unwrap(),
  pointPasFait: scoreSchema.shape.pointPasFait.unwrap(),
  pointNonRenseigne: scoreSchema.shape.pointNonRenseigne.unwrap(),
  pointProgramme: scoreSchema.shape.pointProgramme.unwrap(),
  completedTachesCount: scoreSchema.shape.completedTachesCount.unwrap(),
  faitTachesAvancement: scoreSchema.shape.faitTachesAvancement.unwrap(),
  programmeTachesAvancement:
    scoreSchema.shape.programmeTachesAvancement.unwrap(),
  pasFaitTachesAvancement: scoreSchema.shape.pasFaitTachesAvancement.unwrap(),
  pasConcerneTachesAvancement:
    scoreSchema.shape.pasConcerneTachesAvancement.unwrap(),
});

export type ScoreFinal = Score & {
  pointReferentiel: number;
  pointPotentiel: number;
  pointFait: number;
  pointPasFait: number;
  pointNonRenseigne: number;
  pointProgramme: number;
  completedTachesCount: number;
  faitTachesAvancement: number;
  programmeTachesAvancement: number;
  pasFaitTachesAvancement: number;
  pasConcerneTachesAvancement: number;
};

export const scoreFieldsSchema = z.object({
  scoresTag: z.record(z.string(), scoreWithOnlyPointsSchema),
  score: scoreSchema,
});

export type ScoreFields = z.infer<typeof scoreFieldsSchema>;

export const scoreFinalFieldsSchema = z.object({
  scoresTag: z.record(z.string(), scoreWithOnlyPointsSchema),
  score: scoreFinalSchema,
});

export type ScoreFinalFields = z.infer<typeof scoreFinalFieldsSchema> & {
  scoreIndicatif?: ScoreIndicatifPayload;
};
