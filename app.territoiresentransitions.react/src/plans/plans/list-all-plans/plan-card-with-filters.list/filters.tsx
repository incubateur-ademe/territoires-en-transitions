import { SortPlansActionValue } from '@/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { Select } from '@/ui';
import { ButtonGroup } from '@/ui/design-system/Button/ButtonGroup';

type SortByOption = {
  label: string;
  value: SortPlansActionValue;
  direction: 'asc' | 'desc';
};

const sortByOptions: SortByOption[] = [
  {
    label: 'Ordre alphabétique',
    value: 'nom',
    direction: 'asc',
  },
  {
    label: 'Date de création',
    value: 'created_at',
    direction: 'desc',
  },
];

export const Filters = ({
  plansCount,
  cardDisplay,
  onDisplayChange,
  sortedBy,
  onChangeSort,
}: {
  plansCount: number | undefined;
  cardDisplay: 'circular' | 'row';
  onDisplayChange: (display: 'circular' | 'row') => void;
  sortedBy: SortPlansActionValue;
  onChangeSort: (
    sort: SortPlansActionValue,
    direction: SortByOption['direction']
  ) => void;
}) => (
  <div className="flex items-center gap-8 py-6 border-y border-primary-3">
    <div className="w-64">
      <Select
        options={sortByOptions}
        onChange={(value) => {
          const direction =
            sortByOptions.find((option) => option.value === value)?.direction ??
            'asc';

          onChangeSort(value as SortPlansActionValue, direction);
        }}
        values={sortedBy}
        customItem={(v) => <span className="text-grey-8">{v.label}</span>}
        small
      />
    </div>
    <span className="shrink-0 text-grey-7 mr-auto">
      {`${plansCount ?? '--'} plan${plansCount && plansCount > 1 ? 's' : ''}`}
    </span>

    <ButtonGroup
      activeButtonId={cardDisplay}
      className="max-w-fit hidden"
      size="sm"
      buttons={[
        {
          children: 'Progression',
          icon: 'layout-grid-line',
          onClick: () => onDisplayChange('row'),
          id: 'row',
        },
        {
          children: 'Diagramme',
          icon: 'pie-chart-2-line',
          onClick: () => onDisplayChange('circular'),
          id: 'circular',
        },
      ]}
    />
  </div>
);
