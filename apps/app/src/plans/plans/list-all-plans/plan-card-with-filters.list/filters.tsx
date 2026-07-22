import { appLabels } from '@/app/labels/catalog';
import { Checkbox, Select } from '@tet/ui';
import { PlanCardDisplay } from '../../components/card/plan.card';
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
  display,
  onChangeDisplay,
}: {
  plansCount: number | undefined;
  sortedBy: SortField;
  onChangeSort: (sort: SortField, direction: SortDirection) => void;
  display: PlanCardDisplay;
  onChangeDisplay: (display: PlanCardDisplay) => void;
}) => (
  <div className="flex items-center gap-8">
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
        custom={{
          renderOptionItem: (option) => (
            <span className="text-grey-8 text-sm">{option.label}</span>
          ),
        }}
        small
      />
    </div>
    <Checkbox
      label={appLabels.affichageDiagrammeCirculaire}
      variant="switch"
      checked={display === 'circular'}
      onChange={(event) =>
        onChangeDisplay(event.target.checked ? 'circular' : 'row')
      }
    />
    <span className="shrink-0 text-grey-7">
      {`${plansCount ?? '--'} plan${plansCount && plansCount > 1 ? 's' : ''}`}
    </span>
  </div>
);
