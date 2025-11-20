import {
  ActionDefinition,
  ActionDefinitionEssential,
  ActionTreeNode,
  ActionTypeEnum,
} from '@tet/domain/referentiels';
import {
  ActionDefinitionAvecParent,
  buildReferentielTree,
} from './get-referentiel.service';

describe('ReferentielsService', () => {
  describe('buildReferentielTree', () => {
    it('une tache réglementaire', async () => {
      const actionDefinitions: ActionDefinitionAvecParent[] = [
        {
          actionId: 'eci',
          parentActionId: null,
          points: null,
        },
        {
          actionId: 'eci_1',
          parentActionId: 'eci',
          points: 30,
        },
        {
          actionId: 'eci_1.0',
          parentActionId: 'eci_1',
          pourcentage: 0,
          points: null,
        },
        {
          actionId: 'eci_1.1',
          parentActionId: 'eci_1',
          points: null,
        },
        {
          actionId: 'eci_1.2',
          parentActionId: 'eci_1',
          points: null,
        },
        {
          actionId: 'eci_2',
          parentActionId: 'eci',
          points: 70,
        },
        {
          actionId: 'eci_2.1',
          parentActionId: 'eci_2',
          pourcentage: 20,
          points: null,
        },
        {
          actionId: 'eci_2.2',
          parentActionId: 'eci_2',
          pourcentage: 30,
          points: null,
        },
        {
          actionId: 'eci_2.3',
          parentActionId: 'eci_2',
          pourcentage: 50,
          points: null,
        },
      ];

      const orderedActionTypes: ActionTypeEnum[] = [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ];
      const referentielTree = buildReferentielTree(
        actionDefinitions,
        orderedActionTypes
      );

      const expectedActionEnfant: ActionTreeNode<
        Partial<ActionDefinition> & ActionDefinitionEssential
      > = {
        actionId: 'eci',
        points: 100,
        level: 0,
        actionType: ActionTypeEnum.REFERENTIEL,
        actionsEnfant: [
          {
            actionId: 'eci_1',
            points: 30,
            pourcentage: 30,
            level: 1,
            actionType: ActionTypeEnum.ACTION,
            actionsEnfant: [
              {
                actionId: 'eci_1.0',
                points: 0,
                pourcentage: 0,
                level: 2,
                actionType: ActionTypeEnum.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_1.1',
                points: 15,
                pourcentage: 50,
                level: 2,
                actionType: ActionTypeEnum.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_1.2',
                points: 15,
                pourcentage: 50,
                level: 2,
                actionType: ActionTypeEnum.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
            ],
            tags: [],
          },
          {
            actionId: 'eci_2',
            points: 70,
            pourcentage: 70,
            level: 1,
            actionType: ActionTypeEnum.ACTION,
            actionsEnfant: [
              {
                actionId: 'eci_2.1',
                points: 14,
                pourcentage: 20,
                level: 2,
                actionType: ActionTypeEnum.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_2.2',
                points: 21,
                pourcentage: 30,
                level: 2,
                actionType: ActionTypeEnum.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_2.3',
                points: 35,
                pourcentage: 50,
                level: 2,
                actionType: ActionTypeEnum.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
            ],
            tags: [],
          },
        ],
        tags: [],
      };

      expect(referentielTree).toEqual(expectedActionEnfant);
    });
  });
});
