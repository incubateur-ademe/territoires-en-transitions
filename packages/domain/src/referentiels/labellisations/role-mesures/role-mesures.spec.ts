import { describe, expect, it } from 'vitest';
import { ROLE_IDENTIFIANTS, roleKeyByIdentifiant } from './role-mesures';

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

  it("ne mappe pas un identifiant absent du référentiel", () => {
    expect(roleKeyByIdentifiant('cae').get('0.0.0.0')).toBeUndefined();
  });
});
