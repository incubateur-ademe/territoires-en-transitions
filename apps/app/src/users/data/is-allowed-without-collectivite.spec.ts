import { describe, expect, it } from 'vitest';
import {
  collectiviteBasePath,
  finaliserMonInscriptionUrl,
  invitationPath,
  profilPath,
  rejoindreCollectivitePath,
  recherchesPath,
} from '../../app/paths';
import { isAllowedWithoutCollectivite } from './is-allowed-without-collectivite';

describe('isAllowedWithoutCollectivite', () => {
  it('autorise les pages du tunnel d’onboarding', () => {
    expect(isAllowedWithoutCollectivite(finaliserMonInscriptionUrl)).toBe(true);
    expect(isAllowedWithoutCollectivite(`${invitationPath}/abc`)).toBe(true);
    expect(isAllowedWithoutCollectivite(`${recherchesPath}/collectivites`)).toBe(
      true
    );
    expect(isAllowedWithoutCollectivite(profilPath)).toBe(true);
    expect(isAllowedWithoutCollectivite(rejoindreCollectivitePath)).toBe(true);
    expect(isAllowedWithoutCollectivite(`${collectiviteBasePath}/1/plans`)).toBe(
      true
    );
  });

  it('bloque les autres routes authentifiées', () => {
    expect(isAllowedWithoutCollectivite('/tests/trpc-error')).toBe(false);
    expect(isAllowedWithoutCollectivite('/banniere')).toBe(false);
  });

  it('ignore la query string / l’ancre (pas d’élargissement via ?x=/profil)', () => {
    expect(isAllowedWithoutCollectivite('/rejoindre?redirect=/profil')).toBe(
      false
    );
    expect(isAllowedWithoutCollectivite('/tests#/profil')).toBe(false);
    // une vraie page autorisée reste autorisée même avec une query
    expect(isAllowedWithoutCollectivite(`${profilPath}?tab=infos`)).toBe(true);
  });
});
