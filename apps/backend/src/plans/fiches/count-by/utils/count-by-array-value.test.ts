import { ListFichesRequestFilters } from '@/domain/plans';
import { CountByRecordGeneralType } from '@/domain/utils';
import { ArrayCountByProperty } from '../count-by.types';
import { countByArrayValues } from './count-by-array-value';

describe('countByArrayValues', () => {
  describe('basic functionality', () => {
    it('should count values and map them to the countByMap object', () => {
      const valueArray = [
        { id: 1, nom: 'Partenaire 1' },
        { id: 2, nom: 'Partenaire 2' },
        { id: 1, nom: 'Partenaire 1' },
      ];
      const filters: ListFichesRequestFilters = {};
      const countByMap: CountByRecordGeneralType = {};

      countByArrayValues({
        valueArray,
        filters,
        countByMap,
        countByProperty: 'partenaires',
      });

      expect(countByMap).toEqual({
        '1': { value: 1, label: 'Partenaire 1', count: 2 },
        '2': { value: 2, label: 'Partenaire 2', count: 1 },
      });
    });

    it('should filter out values that match the filter criteria', () => {
      const valueArray = [
        { id: 1, nom: 'Partenaire 1' },
        { id: 2, nom: 'Partenaire 2' },
        { id: 3, nom: 'Partenaire 3' },
        { id: 3, nom: 'Partenaire 3' },
        { id: 3, nom: 'Partenaire 3' },
        { id: 4, nom: 'Partenaire 4' },
        { id: 5, nom: 'Partenaire 5' },
      ];
      const filters: ListFichesRequestFilters = {
        partenaireIds: [1, 3], // Filter in partners with IDs 1 and 3
      };
      const countByMap: CountByRecordGeneralType = {};

      countByArrayValues({
        valueArray,
        filters,
        countByMap,
        countByProperty: 'partenaires' as ArrayCountByProperty,
      });

      expect(countByMap).toEqual({
        '3': { value: 3, label: 'Partenaire 3', count: 3 },
        '1': { value: 1, label: 'Partenaire 1', count: 1 },
      });
    });
  });
});
