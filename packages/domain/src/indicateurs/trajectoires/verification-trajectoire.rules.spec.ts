import { describe, expect, it } from 'vitest';
import { type CollectiviteNatureType } from '../../collectivites/collectivite-banatic-type.enum';
import { collectiviteTypeEnum } from '../../collectivites/collectivite-type.enum';
import { VerificationTrajectoireStatus } from '../verification-trajectoire-status';
import {
  canComputeTrajectoireSnbc,
  isSyndicat,
  isUnsupportedTrajectoireStatus,
} from './verification-trajectoire.rules';

describe('canComputeTrajectoireSnbc', () => {
  it.each<CollectiviteNatureType>(['METRO', 'CU', 'CA', 'CC'])(
    'accepte un EPCI a fiscalite propre de nature %s',
    (natureInsee) => {
      expect(
        canComputeTrajectoireSnbc({
          type: collectiviteTypeEnum.EPCI,
          natureInsee,
        })
      ).toEqual({ canBeComputed: true, reason: null });
    }
  );

  it.each<CollectiviteNatureType>([
    'SMF',
    'SMO',
    'SIVU',
    'SIVOM',
    'POLEM',
    'PETR',
    'EPT',
  ])(
    'refuse la nature de syndicat %s, absente de la liste EPCI du classeur SNBC',
    (natureInsee) => {
      expect(
        canComputeTrajectoireSnbc({
          type: collectiviteTypeEnum.EPCI,
          natureInsee,
        })
      ).toEqual({
        canBeComputed: false,
        reason: VerificationTrajectoireStatus.SYNDICAT_NON_SUPPORTE,
      });
    }
  );

  it("accepte un EPCI dont la nature Banatic n'est pas renseignee", () => {
    expect(
      canComputeTrajectoireSnbc({
        type: collectiviteTypeEnum.EPCI,
        natureInsee: null,
      })
    ).toEqual({ canBeComputed: true, reason: null });
  });

  it('accepte la collectivite de test', () => {
    expect(
      canComputeTrajectoireSnbc({
        type: collectiviteTypeEnum.TEST,
        natureInsee: null,
      })
    ).toEqual({ canBeComputed: true, reason: null });
  });

  it.each([
    collectiviteTypeEnum.COMMUNE,
    collectiviteTypeEnum.DEPARTEMENT,
    collectiviteTypeEnum.REGION,
  ])('refuse une collectivite de type %s', (type) => {
    expect(canComputeTrajectoireSnbc({ type, natureInsee: null })).toEqual({
      canBeComputed: false,
      reason: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
    });
  });
});

describe('isSyndicat', () => {
  it.each<CollectiviteNatureType>([
    'SMF',
    'SMO',
    'SIVU',
    'SIVOM',
    'POLEM',
    'PETR',
    'EPT',
  ])('reconnait %s comme un syndicat', (natureInsee) => {
    expect(isSyndicat(natureInsee)).toBe(true);
  });

  it.each<CollectiviteNatureType>(['METRO', 'CU', 'CA', 'CC'])(
    'ne reconnait pas %s comme un syndicat',
    (natureInsee) => {
      expect(isSyndicat(natureInsee)).toBe(false);
    }
  );

  it('ne se prononce pas quand la nature Banatic est absente', () => {
    expect(isSyndicat(null)).toBe(false);
  });
});

describe('isUnsupportedTrajectoireStatus', () => {
  it.each([
    VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
    VerificationTrajectoireStatus.SYNDICAT_NON_SUPPORTE,
  ])('reconnait %s comme un statut de refus', (status) => {
    expect(isUnsupportedTrajectoireStatus(status)).toBe(true);
  });

  it.each([
    VerificationTrajectoireStatus.PRET_A_CALCULER,
    VerificationTrajectoireStatus.DEJA_CALCULE,
    VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE,
    VerificationTrajectoireStatus.DONNEES_MANQUANTES,
    VerificationTrajectoireStatus.DROITS_INSUFFISANTS,
  ])('ne reconnait pas %s comme un statut de refus', (status) => {
    expect(isUnsupportedTrajectoireStatus(status)).toBe(false);
  });
});
