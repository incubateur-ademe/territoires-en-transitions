import { ActionTypeEnum } from '@/backend/referentiels/models/action-type.enum';
import {
  getActionTypeFromActionId,
  getLevelFromActionId,
} from './referentiels.utils';

describe('getLevelFromActionId', () => {
  test('Standard action', async () => {
    expect(getLevelFromActionId('cae_5.1.4.4.1')).toEqual(5);
  });

  test('Axe', async () => {
    expect(getLevelFromActionId('cae_5')).toEqual(1);
    expect(getLevelFromActionId('5')).toEqual(1);
  });

  test('Referentiel', async () => {
    expect(getLevelFromActionId('cae')).toEqual(0);
  });
});

describe('getActionTypeFromActionId', () => {
  test('Standard action', async () => {
    expect(
      getActionTypeFromActionId('cae_5.1.4.4.1', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toEqual(ActionTypeEnum.TACHE);
  });

  test('Axe', async () => {
    expect(
      getActionTypeFromActionId('cae_5', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toEqual(ActionTypeEnum.AXE);
  });

  test('Referentiel', async () => {
    expect(
      getActionTypeFromActionId('cae', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toEqual(ActionTypeEnum.REFERENTIEL);
  });

  test('Throw', async () => {
    expect(() =>
      getActionTypeFromActionId('cae_5.1.4.4.1.1', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toThrow(
      'Action level 6 non consistent with referentiel action types: referentiel,axe,sous-axe,action,sous-action,tache'
    );
  });
});
