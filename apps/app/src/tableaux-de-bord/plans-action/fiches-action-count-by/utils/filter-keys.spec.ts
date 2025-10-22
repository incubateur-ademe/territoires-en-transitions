import { FilterKeys } from '@/app/plans/fiches/list-all-fiches/filters/types';
import {
  CountByPropertyEnumType,
  countByPropertyOptions,
} from '@/domain/plans/fiches';
import {
  generalCountByToFilterKeyMapping,
  noValueCountByToFilterKeyMapping,
} from './filter-keys';

describe('Test to make sure that we handle all the count by properties correctly', () => {
  it('should return the full list of filter keys', () => {
    const notSupportedCountByToFilterKeyMapping = {
      dateDebut: null,
      dateFin: null,
      createdAt: null,
      modifiedAt: null,
      participationCitoyenneType: null,
      effetsAttendus: null,
      budgetsPrevisionnelInvestissementTotal: null,
      budgetsPrevisionnelInvestissementParAnnee: null,
      budgetsDepenseInvestissementTotal: null,
      budgetsDepenseInvestissementParAnnee: null,
      budgetsPrevisionnelFonctionnementTotal: null,
      budgetsPrevisionnelFonctionnementParAnnee: null,
      budgetsDepenseFonctionnementTotal: null,
      budgetsDepenseFonctionnementParAnnee: null,
    } as const satisfies Partial<Record<CountByPropertyEnumType, null>>;

    const countByToFilterKeyMapping: Record<
      CountByPropertyEnumType,
      FilterKeys | null
    > = {
      ...generalCountByToFilterKeyMapping,
      ...noValueCountByToFilterKeyMapping,
      ...notSupportedCountByToFilterKeyMapping,
    };
    expect(Object.keys(countByToFilterKeyMapping).sort()).toEqual(
      countByPropertyOptions.sort()
    );
  });
});
