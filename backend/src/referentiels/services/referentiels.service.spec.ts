import { Test } from '@nestjs/testing';
import DatabaseService from '../../common/services/database.service';
import { ActionDefinitionAvecParentType } from '../models/action-definition.table';
import { ActionType } from '../models/action-type.enum';
import ReferentielsService from './referentiels.service';

describe('ReferentielsService', () => {
  let referentielsService: ReferentielsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ReferentielsService],
    })
      .useMocker((token) => {
        if (token === DatabaseService) {
          return {};
        }
      })
      .compile();

    referentielsService = moduleRef.get(ReferentielsService);
  });

  describe('buildReferentielTree', () => {
    it('une tache réglementaire', async () => {
      const actionDefinitions: ActionDefinitionAvecParentType[] = [
        {
          action_id: 'eci',
          parent_action_id: null,
        },
        {
          action_id: 'eci_1',
          parent_action_id: 'eci',
          points: 30,
        },
        {
          action_id: 'eci_1.0',
          parent_action_id: 'eci_1',
          pourcentage: 0,
        },
        {
          action_id: 'eci_1.1',
          parent_action_id: 'eci_1',
        },
        {
          action_id: 'eci_1.2',
          parent_action_id: 'eci_1',
        },
        {
          action_id: 'eci_2',
          parent_action_id: 'eci',
          points: 70,
        },
        {
          action_id: 'eci_2.1',
          parent_action_id: 'eci_2',
          pourcentage: 20,
        },
        {
          action_id: 'eci_2.2',
          parent_action_id: 'eci_2',
          pourcentage: 30,
        },
        {
          action_id: 'eci_2.3',
          parent_action_id: 'eci_2',
          pourcentage: 50,
        },
      ];
      const orderedActionTypes: ActionType[] = [
        ActionType.REFERENTIEL,
        ActionType.ACTION,
        ActionType.SOUS_ACTION,
        ActionType.TACHE,
      ];
      const referentielTree = referentielsService.buildReferentielTree(
        actionDefinitions,
        orderedActionTypes
      );
      expect(referentielTree).toEqual({
        action_id: 'eci',
        points: 100,
        level: 0,
        action_type: ActionType.REFERENTIEL,
        actions_enfant: [
          {
            action_id: 'eci_1',
            points: 30,
            pourcentage: 30,
            level: 1,
            action_type: ActionType.ACTION,
            actions_enfant: [
              {
                action_id: 'eci_1.0',
                points: 0,
                pourcentage: 0,
                level: 2,
                action_type: ActionType.SOUS_ACTION,
                actions_enfant: [],
              },
              {
                action_id: 'eci_1.1',
                points: 15,
                pourcentage: 50,
                level: 2,
                action_type: ActionType.SOUS_ACTION,
                actions_enfant: [],
              },
              {
                action_id: 'eci_1.2',
                points: 15,
                pourcentage: 50,
                level: 2,
                action_type: ActionType.SOUS_ACTION,
                actions_enfant: [],
              },
            ],
          },
          {
            action_id: 'eci_2',
            points: 70,
            pourcentage: 70,
            level: 1,
            action_type: ActionType.ACTION,
            actions_enfant: [
              {
                action_id: 'eci_2.1',
                points: 14,
                pourcentage: 20,
                level: 2,
                action_type: ActionType.SOUS_ACTION,
                actions_enfant: [],
              },
              {
                action_id: 'eci_2.2',
                points: 21,
                pourcentage: 30,
                level: 2,
                action_type: ActionType.SOUS_ACTION,
                actions_enfant: [],
              },
              {
                action_id: 'eci_2.3',
                points: 35,
                pourcentage: 50,
                level: 2,
                action_type: ActionType.SOUS_ACTION,
                actions_enfant: [],
              },
            ],
          },
        ],
      });
    });
  });
});
