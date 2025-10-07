import { Select } from '@/ui';
import {
  isSortValue,
  sortByOptions,
  SortDirection,
  SortField,
} from './sorting-parameters';
export const Filters = ({
  plansCount,
  sortedBy,
  onChangeSort,
}: {
  plansCount: number | undefined;
  sortedBy: SortField;
  onChangeSort: (sort: SortField, direction: SortDirection) => void;
}) => (
  <div className="flex items-center gap-8 py-6 border-y border-primary-3">
    <div className="w-64">
      <Select
        options={sortByOptions}
        onChange={(unsafeValue) => {
          const sanitizedValue = isSortValue(unsafeValue)
            ? unsafeValue
            : sortByOptions[0].value;
          const direction =
            sortByOptions.find((option) => option.value === sanitizedValue)
              ?.direction ?? 'asc';
          onChangeSort(sanitizedValue, direction);
        }}
        values={sortedBy}
        customItem={(v) => <span className="text-grey-8">{v.label}</span>}
        small
      />
    </div>
    <span className="shrink-0 text-grey-7 mr-auto">
      {`${plansCount ?? '--'} plan${plansCount && plansCount > 1 ? 's' : ''}`}
    </span>
  </div>
);
