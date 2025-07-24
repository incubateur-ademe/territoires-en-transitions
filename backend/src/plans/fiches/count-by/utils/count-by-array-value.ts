import { ListFichesRequestFilters } from '@/backend/plans/fiches/list-fiches/list-fiches.request';
import { CountByRecordGeneralType } from '@/backend/utils/count-by.dto';
import {
  ArrayCountByProperty,
  countByPropertyFichesFiltersKeysMapping,
} from '../count-by.types';

export function countByArrayValues({
  valueArray,
  filters,
  countByMap,
  countByProperty,
}: {
  valueArray: Array<{ id: string | number; nom: string }>;
  filters: ListFichesRequestFilters;
  countByMap: CountByRecordGeneralType;
  countByProperty: ArrayCountByProperty;
}) {
  const filterKey = countByPropertyFichesFiltersKeysMapping[countByProperty];

  const additionalFilters = filterKey ? filters[filterKey] || null : null;

  valueArray.forEach((value) => {
    const valueKey = `${value.id}`;

    const isValueSpecificallyFilteredOut =
      additionalFilters?.some((filter) => filter === value.id) === false;

    if (isValueSpecificallyFilteredOut) {
      return;
    }
    if (!countByMap[valueKey]) {
      countByMap[valueKey] = {
        value: value.id,
        label: value.nom,
        count: 0,
      };
    }
    countByMap[valueKey].count++;
  });
}
