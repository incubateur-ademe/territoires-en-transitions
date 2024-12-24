import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { ActionAvancementEnumValues } from './action-statut.table';

export const actionScoreSchema = extendApi(
  z
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
        .describe('La valeur de base tel que calculé à partir des markdowns'),
      pointFait: z
        .number()
        .nullable()
        .describe(
          'Pour une tache avec un statut fait, est égal au point référentiel'
        ),
      pointProgramme: z
        .number()
        .nullable()
        .describe(
          'Pour une tache avec un statut programmé, est égal au point référentiel'
        ),
      pointPasFait: z
        .number()
        .nullable()
        .describe(
          'Pour une tache avec un statut pas fait, est égal au point référentiel'
        ),
      pointNonRenseigne: z
        .number()
        .nullable()
        .describe('Pour une tache sans statut, est égal au point référentiel'),
      pointPotentiel: z
        .number()
        .nullable()
        .describe(
          'Le potentiel personnalisé est calculé à partir du potentiel, auquel on ajoute le reliquat des points des actions désactivées'
        ),
      concerne: z
        .boolean()
        .describe(
          "Faux si la collectivité s'est déclarée comme non concernée pour cette action ou pour tous ses enfants. A noter qu'une désactivation par personnalisation entraine également un non concerné"
        ),
      totalTachesCount: z
        .number()
        .int()
        .describe(
          "Le nombre de taches d'une action, est égal à 1 si l'action est une tache"
        ),
      completedTachesCount: z
        .number()
        .int()
        .nullable()
        .describe('Le nombre de taches renseignées'),
      faitTachesAvancement: z
        .number()
        .nullable()
        .describe(
          'La somme des proportions du fait des tâches, si une tache à un statut fait à 50% equal à 0.5'
        ),
      programmeTachesAvancement: z
        .number()
        .nullable()
        .describe(
          'La somme des proportions du programme des tâches, si une tache à un statut programmé à 50% est égal à 0.5'
        ),
      pasFaitTachesAvancement: z
        .number()
        .nullable()
        .describe(
          'La somme des proportions du pas fait des tâches, si une tache à un statut pas fait à 50% est égal à 0.5'
        ),
      pasConcerneTachesAvancement: z
        .number()
        .nullable()
        .describe(
          'La somme du non concerné des tâches. Si une tache est déclarée non concerné, est égal à 1.0'
        ),
      desactive: z
        .boolean()
        .describe(
          "Vrai si l'action ou un de ses ancêtres est désactivé du fait de la personnalisation"
        ),
      pointPotentielPerso: z
        .number()
        .nullable()
        .describe(
          'Le potentiel est calculé à partir des conséquences de la personnalisation, soit point référentiel x facteur de la personnalisation'
        ),
      aStatut: z
        .boolean()
        .optional()
        .describe(
          'Vrai si un statut a été renseigné pour cette action (sous-action ou tache'
        ),
      avancement: z
        .enum(ActionAvancementEnumValues)
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
    )
);

export type ActionScoreType = z.infer<typeof actionScoreSchema>;
