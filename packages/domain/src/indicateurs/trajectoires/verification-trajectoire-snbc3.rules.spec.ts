import { describe, expect, it } from 'vitest';
import { type CollectiviteNatureType } from '../../collectivites/collectivite-banatic-type.enum';
import {
  collectiviteTypeEnum,
  type CollectiviteType,
} from '../../collectivites/collectivite-type.enum';
import {
  getStatutTrajectoireSnbc3,
  isEpciFiscalitePropre,
  StatutTrajectoireSnbc3,
} from './verification-trajectoire-snbc3.rules';

const statut = (
  collectivite: {
    type: CollectiviteType;
    natureInsee: CollectiviteNatureType | null;
  },
  { isInMillesime = false, hasDroitsLecture = true } = {}
) =>
  getStatutTrajectoireSnbc3({ hasDroitsLecture, isInMillesime, collectivite });

describe('getStatutTrajectoireSnbc3', () => {
  it('droits insuffisants avant tout le reste', () => {
    expect(
      statut(
        { type: collectiviteTypeEnum.EPCI, natureInsee: 'CA' },
        { isInMillesime: true, hasDroitsLecture: false }
      )
    ).toBe(StatutTrajectoireSnbc3.DROITS_INSUFFISANTS);
  });

  it.each<CollectiviteNatureType>(['CC', 'CA', 'CU', 'METRO', 'EPT'])(
    'disponible pour un EPCI %s présent dans le millésime',
    (natureInsee) => {
      expect(
        statut(
          { type: collectiviteTypeEnum.EPCI, natureInsee },
          { isInMillesime: true }
        )
      ).toBe(StatutTrajectoireSnbc3.DISPONIBLE);
    }
  );

  it('disponible pour Paris, commune présente dans le millésime', () => {
    expect(
      statut(
        { type: collectiviteTypeEnum.COMMUNE, natureInsee: null },
        { isInMillesime: true }
      )
    ).toBe(StatutTrajectoireSnbc3.DISPONIBLE);
  });

  it.each<CollectiviteNatureType>(['CC', 'CA', 'CU', 'METRO', 'EPT'])(
    'absent du millésime pour un EPCI %s sans trajectoire',
    (natureInsee) => {
      expect(statut({ type: collectiviteTypeEnum.EPCI, natureInsee })).toBe(
        StatutTrajectoireSnbc3.ABSENT_DU_MILLESIME
      );
    }
  );

  it('absent du millésime pour une collectivité de test sans trajectoire', () => {
    expect(statut({ type: collectiviteTypeEnum.TEST, natureInsee: null })).toBe(
      StatutTrajectoireSnbc3.ABSENT_DU_MILLESIME
    );
  });

  it('commune non supportée pour une commune absente', () => {
    expect(
      statut({ type: collectiviteTypeEnum.COMMUNE, natureInsee: null })
    ).toBe(StatutTrajectoireSnbc3.COMMUNE_NON_SUPPORTEE);
  });

  it.each<CollectiviteNatureType>([
    'SMF',
    'SMO',
    'SIVU',
    'SIVOM',
    'POLEM',
    'PETR',
  ])('maille non supportée pour un syndicat ou PETR (%s)', (natureInsee) => {
    expect(statut({ type: collectiviteTypeEnum.EPCI, natureInsee })).toBe(
      StatutTrajectoireSnbc3.SUPRA_NON_SUPPORTE
    );
  });

  it.each<CollectiviteType>([
    collectiviteTypeEnum.REGION,
    collectiviteTypeEnum.DEPARTEMENT,
  ])('maille non supportée pour un(e) %s', (type) => {
    expect(statut({ type, natureInsee: null })).toBe(
      StatutTrajectoireSnbc3.SUPRA_NON_SUPPORTE
    );
  });

  it('maille non supportée pour un EPCI sans nature (à corriger dans TeT)', () => {
    expect(statut({ type: collectiviteTypeEnum.EPCI, natureInsee: null })).toBe(
      StatutTrajectoireSnbc3.SUPRA_NON_SUPPORTE
    );
  });
});

describe('isEpciFiscalitePropre', () => {
  it.each<[CollectiviteNatureType | null, boolean]>([
    ['CC', true],
    ['CA', true],
    ['CU', true],
    ['METRO', true],
    ['EPT', false],
    ['PETR', false],
    [null, false],
  ])('%s → %s', (natureInsee, expected) => {
    expect(isEpciFiscalitePropre(natureInsee)).toBe(expected);
  });
});
