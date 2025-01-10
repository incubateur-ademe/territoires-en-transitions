import { ActionType } from './index-domain';
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
  });

  test('Referentiel', async () => {
    expect(getLevelFromActionId('cae')).toEqual(0);
  });
});

describe('getActionTypeFromActionId', () => {
  test('Standard action', async () => {
    expect(
      getActionTypeFromActionId('cae_5.1.4.4.1', [
        ActionType.REFERENTIEL,
        ActionType.AXE,
        ActionType.SOUS_AXE,
        ActionType.ACTION,
        ActionType.SOUS_ACTION,
        ActionType.TACHE,
      ])
    ).toEqual(ActionType.TACHE);
  });

  test('Axe', async () => {
    expect(
      getActionTypeFromActionId('cae_5', [
        ActionType.REFERENTIEL,
        ActionType.AXE,
        ActionType.SOUS_AXE,
        ActionType.ACTION,
        ActionType.SOUS_ACTION,
        ActionType.TACHE,
      ])
    ).toEqual(ActionType.AXE);
  });

  test('Referentiel', async () => {
    expect(
      getActionTypeFromActionId('cae', [
        ActionType.REFERENTIEL,
        ActionType.AXE,
        ActionType.SOUS_AXE,
        ActionType.ACTION,
        ActionType.SOUS_ACTION,
        ActionType.TACHE,
      ])
    ).toEqual(ActionType.REFERENTIEL);
  });

  test('Throw', async () => {
    expect(() =>
      getActionTypeFromActionId('cae_5.1.4.4.1.1', [
        ActionType.REFERENTIEL,
        ActionType.AXE,
        ActionType.SOUS_AXE,
        ActionType.ACTION,
        ActionType.SOUS_ACTION,
        ActionType.TACHE,
      ])
    ).toThrow(
      'Action level 6 non consistent with referentiel action types: referentiel,axe,sous-axe,action,sous-action,tache'
    );
  });
});
