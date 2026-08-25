import { describe, expect, it } from 'vitest';
import {
  areAllReferentRolesDefined,
  isReferentRoleDefined,
  ROLE_IDENTIFIANTS,
  ReferentRolesDefined,
  roleKeyByIdentifiant,
} from './role-mesures';

const TOUS_ROLES_DEFINIS: ReferentRolesDefined = {
  eluReferent: true,
  referentTechnique: true,
};

const toCritere = (identifiant: string): { action_id: string } => ({
  action_id: `cae_${identifiant}`,
});

describe('roleKeyByIdentifiant', () => {
  it('mappe les identifiants cae vers leur rôle', () => {
    const mapping = roleKeyByIdentifiant('cae');
    expect(mapping.get(ROLE_IDENTIFIANTS.cae.eluReferent)).toBe('eluReferent');
    expect(mapping.get(ROLE_IDENTIFIANTS.cae.referentTechnique)).toBe(
      'referentTechnique'
    );
  });

  it('mappe les identifiants eci vers leur rôle', () => {
    const mapping = roleKeyByIdentifiant('eci');
    expect(mapping.get(ROLE_IDENTIFIANTS.eci.eluReferent)).toBe('eluReferent');
    expect(mapping.get(ROLE_IDENTIFIANTS.eci.referentTechnique)).toBe(
      'referentTechnique'
    );
  });

  it('ne mappe pas un identifiant absent du référentiel', () => {
    expect(roleKeyByIdentifiant('cae').get('0.0.0.0')).toBeUndefined();
  });
});

describe('isReferentRoleDefined', () => {
  it("considère présent tout critère d'un référentiel hors audit-labellisation", () => {
    expect(
      isReferentRoleDefined({ action_id: 'te_1.1.1' }, 'te', TOUS_ROLES_DEFINIS)
    ).toBe(true);
  });

  it("considère présent un critère qui n'est pas une mesure de rôle", () => {
    expect(
      isReferentRoleDefined(toCritere('9.9.9.9'), 'cae', {
        eluReferent: false,
        referentTechnique: false,
      })
    ).toBe(true);
  });

  it("considère présent un critère dont l'action_id n'a pas d'identifiant", () => {
    expect(
      isReferentRoleDefined({ action_id: 'cae' }, 'cae', {
        eluReferent: false,
        referentTechnique: false,
      })
    ).toBe(true);
  });

  it("est vrai quand l'élu référent est désigné", () => {
    expect(
      isReferentRoleDefined(
        toCritere(ROLE_IDENTIFIANTS.cae.eluReferent),
        'cae',
        { eluReferent: true, referentTechnique: false }
      )
    ).toBe(true);
  });

  it("est faux quand l'élu référent n'est pas désigné", () => {
    expect(
      isReferentRoleDefined(
        toCritere(ROLE_IDENTIFIANTS.cae.eluReferent),
        'cae',
        { eluReferent: false, referentTechnique: true }
      )
    ).toBe(false);
  });

  it("est faux quand le référent technique n'est pas désigné", () => {
    expect(
      isReferentRoleDefined(
        toCritere(ROLE_IDENTIFIANTS.cae.referentTechnique),
        'cae',
        { eluReferent: true, referentTechnique: false }
      )
    ).toBe(false);
  });
});

describe('areAllReferentRolesDefined', () => {
  const criteresAvecLesDeuxRoles = [
    toCritere(ROLE_IDENTIFIANTS.cae.eluReferent),
    toCritere(ROLE_IDENTIFIANTS.cae.referentTechnique),
  ];

  it('est vrai quand les deux rôles sont désignés', () => {
    expect(
      areAllReferentRolesDefined(
        criteresAvecLesDeuxRoles,
        'cae',
        TOUS_ROLES_DEFINIS
      )
    ).toBe(true);
  });

  it("est faux quand aucun élu référent n'est désigné", () => {
    expect(
      areAllReferentRolesDefined(criteresAvecLesDeuxRoles, 'cae', {
        eluReferent: false,
        referentTechnique: true,
      })
    ).toBe(false);
  });

  it("est faux quand aucun référent technique n'est désigné", () => {
    expect(
      areAllReferentRolesDefined(criteresAvecLesDeuxRoles, 'cae', {
        eluReferent: true,
        referentTechnique: false,
      })
    ).toBe(false);
  });

  it("est vrai quand aucune mesure de rôle n'est au programme de l'étoile visée", () => {
    expect(
      areAllReferentRolesDefined([toCritere('1.1.2.0.1')], 'cae', {
        eluReferent: false,
        referentTechnique: false,
      })
    ).toBe(true);
  });

  it('est vrai sur un référentiel sans mesure de rôle', () => {
    expect(
      areAllReferentRolesDefined(criteresAvecLesDeuxRoles, 'te', {
        eluReferent: false,
        referentTechnique: false,
      })
    ).toBe(true);
  });
});
