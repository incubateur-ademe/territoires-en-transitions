import { ActionTypeEnum } from './actions/action-type.enum';
import {
  getActionTypeFromActionId,
  getLevelFromActionId,
  normalizeIdentifiantReferentiel,
} from './referentiel.utils';

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

describe('normalizeIdentifiantReferentiel', () => {
  describe('CAE prefix', () => {
    test('normalise cae18 vers cae_18', () => {
      expect(normalizeIdentifiantReferentiel('cae18')).toBe('cae_18');
    });

    test('normalise cae_18 vers cae_18', () => {
      expect(normalizeIdentifiantReferentiel('cae_18')).toBe('cae_18');
    });

    test('normalise cae 18 vers cae_18', () => {
      expect(normalizeIdentifiantReferentiel('cae 18')).toBe('cae_18');
    });

    test('normalise cae18a vers cae_18.a', () => {
      expect(normalizeIdentifiantReferentiel('cae18a')).toBe('cae_18.a');
    });

    test('normalise cae_18.a vers cae_18.a', () => {
      expect(normalizeIdentifiantReferentiel('cae_18.a')).toBe('cae_18.a');
    });

    test('normalise cae 18 a vers cae_18.a', () => {
      expect(normalizeIdentifiantReferentiel('cae 18 a')).toBe('cae_18.a');
    });

    test('normalise cae1a vers cae_1.a', () => {
      expect(normalizeIdentifiantReferentiel('cae1a')).toBe('cae_1.a');
    });

    test('normalise cae_1.a vers cae_1.a', () => {
      expect(normalizeIdentifiantReferentiel('cae_1.a')).toBe('cae_1.a');
    });

    test('normalise cae1.ca vers cae_1.ca', () => {
      expect(normalizeIdentifiantReferentiel('cae1.ca')).toBe('cae_1.ca');
    });

    test('normalise cae1ca vers cae_1.ca', () => {
      expect(normalizeIdentifiantReferentiel('cae1ca')).toBe('cae_1.ca');
    });

    test('gère les majuscules', () => {
      expect(normalizeIdentifiantReferentiel('CAE_18')).toBe('cae_18');
      expect(normalizeIdentifiantReferentiel('CAE18A')).toBe('cae_18.a');
    });
  });

  describe('ECI prefix', () => {
    test('normalise eci2 vers eci_2', () => {
      expect(normalizeIdentifiantReferentiel('eci2')).toBe('eci_2');
    });

    test('normalise eci_2 vers eci_2', () => {
      expect(normalizeIdentifiantReferentiel('eci_2')).toBe('eci_2');
    });

    test('normalise eci 2 vers eci_2', () => {
      expect(normalizeIdentifiantReferentiel('eci 2')).toBe('eci_2');
    });

    test('normalise eci2a vers eci_2.a', () => {
      expect(normalizeIdentifiantReferentiel('eci2a')).toBe('eci_2.a');
    });
  });

  describe('CRTE prefix', () => {
    test('normalise crte1 vers crte_1', () => {
      expect(normalizeIdentifiantReferentiel('crte1')).toBe('crte_1');
    });

    test('normalise crte_1 vers crte_1', () => {
      expect(normalizeIdentifiantReferentiel('crte_1')).toBe('crte_1');
    });

    test('normalise crte1.1 vers crte_1.1', () => {
      expect(normalizeIdentifiantReferentiel('crte1.1')).toBe('crte_1.1');
    });

    test('normalise crte_1.1 vers crte_1.1', () => {
      expect(normalizeIdentifiantReferentiel('crte_1.1')).toBe('crte_1.1');
    });
  });

  describe('Invalid inputs', () => {
    test('retourne null pour un texte sans prefix valide', () => {
      expect(normalizeIdentifiantReferentiel('test')).toBeNull();
      expect(normalizeIdentifiantReferentiel('abc123')).toBeNull();
      expect(normalizeIdentifiantReferentiel('hello world')).toBeNull();
    });

    test('retourne null pour un prefix seul', () => {
      expect(normalizeIdentifiantReferentiel('cae')).toBeNull();
      expect(normalizeIdentifiantReferentiel('eci')).toBeNull();
      expect(normalizeIdentifiantReferentiel('crte')).toBeNull();
    });

    test('retourne null pour un format invalide', () => {
      expect(normalizeIdentifiantReferentiel('cae_abc')).toBeNull();
      expect(normalizeIdentifiantReferentiel('eci-2')).toBeNull();
    });
  });

  describe('Edge cases', () => {
    test('gère les espaces multiples', () => {
      expect(normalizeIdentifiantReferentiel('cae  18  a')).toBe('cae_18.a');
    });

    test('gère les underscores multiples', () => {
      expect(normalizeIdentifiantReferentiel('cae___18')).toBe('cae_18');
    });

    test('gère les nombres avec plusieurs niveaux', () => {
      expect(normalizeIdentifiantReferentiel('cae1.1.2')).toBe('cae_1.1.2');
      expect(normalizeIdentifiantReferentiel('cae 1.1.2')).toBe('cae_1.1.2');
    });

    test('gère les identifiants avec tirets', () => {
      expect(normalizeIdentifiantReferentiel('cae49a-hab')).toBe(
        'cae_49.a-hab'
      );
      expect(normalizeIdentifiantReferentiel('cae_49.a-hab')).toBe(
        'cae_49.a-hab'
      );
      expect(normalizeIdentifiantReferentiel('cae 49 a-hab')).toBe(
        'cae_49.a-hab'
      );
    });
  });
});
