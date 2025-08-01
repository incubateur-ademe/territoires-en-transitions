import { ScoreFinalFields } from '@/backend/referentiels/compute-score/score.dto';
import { ActionDefinitionEssential, TreeNode } from '../action-definition.dto';
import {
  ActionCategorieEnum,
  ActionDefinition,
} from '../action-definition.table';
import { ActionTypeEnum } from '../action-type.enum';

type ActionDefinitionFields = ActionDefinitionEssential &
  Pick<ActionDefinition, 'nom' | 'identifiant' | 'categorie'>;

export const deeperReferentielScoring: TreeNode<
  ActionDefinitionFields & ScoreFinalFields
> = {
  actionId: 'eci',
  identifiant: 'eci',
  nom: 'Référentiel Économie Circulaire',
  categorie: null,
  points: 100,
  level: 0,
  actionType: ActionTypeEnum.REFERENTIEL,
  actionsEnfant: [
    {
      actionId: 'eci_1',
      identifiant: '1',
      nom: 'Action 1',
      categorie: null,
      points: 30,
      level: 1,
      actionType: ActionTypeEnum.ACTION,
      actionsEnfant: [
        {
          actionId: 'eci_1.1',
          identifiant: '1.1',
          nom: 'Sous-action 1.1',
          categorie: null,
          points: 10,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
          score: {
            actionId: 'eci_1.1',
            pointReferentiel: 10,
            pointPotentiel: 10,
            pointPotentielPerso: null,
            pointFait: 0,
            pointPasFait: 0,
            pointNonRenseigne: 10,
            pointProgramme: 0,
            concerne: false,
            completedTachesCount: 0,
            totalTachesCount: 1,
            faitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
            desactive: false,
            renseigne: false,
          },
          scoresTag: {},
        },
        {
          actionId: 'eci_1.2',
          identifiant: '1.2',
          nom: 'Sous-action 1.2',
          categorie: null,
          points: 20,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
          score: {
            actionId: 'eci_1.2',
            pointReferentiel: 20,
            pointPotentiel: 20,
            pointPotentielPerso: null,
            pointFait: 0,
            pointPasFait: 0,
            pointNonRenseigne: 20,
            pointProgramme: 0,
            concerne: true,
            completedTachesCount: 0,
            totalTachesCount: 1,
            faitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
            desactive: true,
            renseigne: false,
          },
          scoresTag: {},
        },
      ],
      score: {
        actionId: 'eci_1',
        pointReferentiel: 30,
        pointPotentiel: 30,
        pointPotentielPerso: null,
        pointFait: 0,
        pointPasFait: 0,
        pointNonRenseigne: 30,
        pointProgramme: 0,
        concerne: true,
        completedTachesCount: 0,
        totalTachesCount: 2,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        renseigne: false,
      },
      scoresTag: {},
    },
    {
      actionId: 'eci_2',
      identifiant: '2',
      nom: 'Action 2',
      categorie: null,
      points: 70,
      level: 1,
      actionType: ActionTypeEnum.ACTION,
      actionsEnfant: [
        {
          actionId: 'eci_2.0',
          identifiant: '2.0',
          nom: 'Sous-action 2.0',
          categorie: null,
          points: 0,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
          score: {
            actionId: 'eci_2.0',
            pointReferentiel: 0,
            pointPotentiel: 0,
            pointPotentielPerso: null,
            pointFait: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointProgramme: 0,
            concerne: true,
            completedTachesCount: 0,
            totalTachesCount: 1,
            faitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
            desactive: false,
            renseigne: false,
          },
          scoresTag: {},
        },
        {
          actionId: 'eci_2.1',
          identifiant: '2.1',
          nom: 'Mettre en œuvre les actions du PLPDMA',
          categorie: ActionCategorieEnum.MISE_EN_OEUVRE,
          points: 65,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [
            {
              actionId: 'eci_2.1.0',
              identifiant: '2.1.0',
              nom: 'Tache 2.1.0',
              categorie: null,
              points: 0,
              level: 3,
              actionType: ActionTypeEnum.TACHE,
              actionsEnfant: [
                {
                  nom: 'Doter la politique climat-air-énergie de moyens humains',
                  level: 4,
                  score: {
                    actionId: 'eci_2.1.0.1 ',
                    concerne: true,
                    desactive: false,
                    pointFait: 0,
                    renseigne: false,
                    pointPasFait: 0,
                    pointPotentiel: 1.2,
                    pointProgramme: 0,
                    pointReferentiel: 1.2,
                    totalTachesCount: 3,
                    pointNonRenseigne: 1.2,
                    pointPotentielPerso: null,
                    completedTachesCount: 0,
                    faitTachesAvancement: 0,
                    pasFaitTachesAvancement: 0,
                    programmeTachesAvancement: 0,
                    pasConcerneTachesAvancement: 0,
                  },
                  points: 1.2,
                  actionId: 'eci_2.1.0.1',
                  categorie: ActionCategorieEnum.BASES,
                  scoresTag: {},
                  actionType: ActionTypeEnum.SOUS_ACTION,
                  identifiant: '2.1.0.1',
                  actionsEnfant: [],
                },
              ],
              score: {
                actionId: 'eci_2.1.0',
                pointReferentiel: 0,
                pointPotentiel: 0,
                pointPotentielPerso: null,
                pointFait: 0,
                pointPasFait: 0,
                pointNonRenseigne: 0,
                pointProgramme: 0,
                concerne: true,
                completedTachesCount: 0,
                totalTachesCount: 1,
                faitTachesAvancement: 0,
                programmeTachesAvancement: 0,
                pasFaitTachesAvancement: 0,
                pasConcerneTachesAvancement: 0,
                desactive: false,
                renseigne: false,
              },
              scoresTag: {},
            },
            {
              actionId: 'eci_2.1.1',
              identifiant: '2.1.1',
              nom: 'Tache 2.1.1',
              categorie: null,
              points: 40,
              level: 3,
              actionType: ActionTypeEnum.TACHE,
              actionsEnfant: [],
              score: {
                actionId: 'eci_2.1.1',
                pointReferentiel: 40,
                pointPotentiel: 40,
                pointPotentielPerso: null,
                pointFait: 32,
                pointPasFait: 0,
                pointNonRenseigne: 0,
                pointProgramme: 8,
                concerne: true,
                completedTachesCount: 1,
                totalTachesCount: 1,
                faitTachesAvancement: 0.8,
                programmeTachesAvancement: 0.2,
                pasFaitTachesAvancement: 0,
                pasConcerneTachesAvancement: 0,
                desactive: false,
                renseigne: true,
                aStatut: true,
                avancement: 'detaille',
              },
              scoresTag: {},
            },
            {
              actionId: 'eci_2.1.2',
              identifiant: '2.1.2',
              nom: 'Tache 2.1.2',
              categorie: null,
              points: 25,
              level: 3,
              actionType: ActionTypeEnum.TACHE,
              actionsEnfant: [],
              score: {
                actionId: 'eci_2.1.2',
                pointReferentiel: 25,
                pointPotentiel: 25,
                pointPotentielPerso: null,
                pointFait: 0,
                pointPasFait: 0,
                pointNonRenseigne: 25,
                pointProgramme: 0,
                concerne: true,
                completedTachesCount: 0,
                totalTachesCount: 1,
                faitTachesAvancement: 0,
                programmeTachesAvancement: 0,
                pasFaitTachesAvancement: 0,
                pasConcerneTachesAvancement: 0,
                desactive: false,
                renseigne: false,
              },
              scoresTag: {},
            },
          ],
          score: {
            actionId: 'eci_2.1',
            pointReferentiel: 65,
            pointPotentiel: 65,
            pointPotentielPerso: null,
            pointFait: 65,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointProgramme: 0,
            concerne: true,
            completedTachesCount: 3,
            totalTachesCount: 3,
            faitTachesAvancement: 3,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
            desactive: false,
            renseigne: true,
            aStatut: true,
            avancement: 'fait',
          },
          scoresTag: {},
        },
        {
          actionId: 'eci_2.2',
          identifiant: '2.2',
          nom: 'Sous-action 2.2',
          categorie: ActionCategorieEnum.BASES,
          points: 5,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [
            {
              actionId: 'eci_2.2.1',
              identifiant: '2.2.1',
              nom: 'Tache 2.2.1',
              categorie: null,
              points: 2,
              level: 3,
              actionType: ActionTypeEnum.TACHE,
              actionsEnfant: [],
              score: {
                actionId: 'eci_2.2.1',
                pointReferentiel: 2,
                pointPotentiel: 2,
                pointPotentielPerso: null,
                pointFait: 0,
                pointPasFait: 0,
                pointNonRenseigne: 2,
                pointProgramme: 0,
                concerne: true,
                completedTachesCount: 0,
                totalTachesCount: 1,
                faitTachesAvancement: 0,
                programmeTachesAvancement: 0,
                pasFaitTachesAvancement: 0,
                pasConcerneTachesAvancement: 0,
                desactive: false,
                renseigne: false,
              },
              scoresTag: {},
            },
            {
              actionId: 'eci_2.2.2',
              identifiant: '2.2.2',
              nom: 'Tache 2.2.2',
              categorie: null,
              points: 1.5,
              level: 3,
              actionType: ActionTypeEnum.TACHE,
              actionsEnfant: [],
              score: {
                actionId: 'eci_2.2.2',
                pointReferentiel: 1.5,
                pointPotentiel: 1.5,
                pointPotentielPerso: null,
                pointFait: 0,
                pointPasFait: 1.5,
                pointNonRenseigne: 0,
                pointProgramme: 0,
                concerne: true,
                completedTachesCount: 1,
                totalTachesCount: 1,
                faitTachesAvancement: 0,
                programmeTachesAvancement: 0,
                pasFaitTachesAvancement: 1,
                pasConcerneTachesAvancement: 0,
                aStatut: true,
                avancement: 'pas_fait',
                desactive: false,
                renseigne: false,
              },
              scoresTag: {},
            },
            {
              actionId: 'eci_2.2.3',
              identifiant: '2.2.3',
              nom: 'Tache 2.2.3',
              categorie: null,
              points: 1.5,
              level: 3,
              actionType: ActionTypeEnum.TACHE,
              actionsEnfant: [],
              score: {
                actionId: 'eci_2.2.3',
                pointReferentiel: 1.5,
                pointPotentiel: 1.5,
                pointPotentielPerso: null,
                pointFait: 0,
                pointPasFait: 0,
                pointNonRenseigne: 1.5,
                pointProgramme: 0,
                concerne: true,
                completedTachesCount: 0,
                totalTachesCount: 1,
                faitTachesAvancement: 0,
                programmeTachesAvancement: 0,
                pasFaitTachesAvancement: 0,
                pasConcerneTachesAvancement: 0,
                desactive: false,
                renseigne: false,
              },
              scoresTag: {},
            },
          ],
          score: {
            actionId: 'eci_2.2',
            pointReferentiel: 5,
            pointPotentiel: 5,
            pointPotentielPerso: null,
            pointFait: 0,
            pointPasFait: 1.5,
            pointNonRenseigne: 3.5,
            pointProgramme: 0,
            concerne: true,
            completedTachesCount: 1,
            totalTachesCount: 3,
            faitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 1,
            pasConcerneTachesAvancement: 0,
            desactive: false,
            renseigne: false,
          },
          scoresTag: {},
        },
      ],
      score: {
        actionId: 'eci_2',
        pointReferentiel: 70,
        pointPotentiel: 70,
        pointPotentielPerso: null,
        pointFait: 65,
        pointPasFait: 0,
        pointNonRenseigne: 5,
        pointProgramme: 0,
        concerne: true,
        completedTachesCount: 3,
        totalTachesCount: 7,
        faitTachesAvancement: 3,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        renseigne: false,
      },
      scoresTag: {},
    },
  ],
  score: {
    actionId: 'eci',
    pointReferentiel: 100,
    pointPotentiel: 100,
    pointPotentielPerso: null,
    pointFait: 65,
    pointPasFait: 0,
    pointNonRenseigne: 35,
    pointProgramme: 0,
    concerne: true,
    completedTachesCount: 3,
    totalTachesCount: 9,
    faitTachesAvancement: 3,
    programmeTachesAvancement: 0,
    pasFaitTachesAvancement: 0,
    pasConcerneTachesAvancement: 0,
    desactive: false,
    renseigne: false,
  },
  scoresTag: {},
};
