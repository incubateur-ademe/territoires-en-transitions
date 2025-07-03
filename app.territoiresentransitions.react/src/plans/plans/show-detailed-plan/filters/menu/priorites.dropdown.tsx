import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import { usePlanFilters } from '@/app/plans/plans/show-detailed-plan/filters/plan-filters.context';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { TOption } from '@/app/ui/shared/select/commons';
import { SANS_PRIORITE_LABEL } from '@/backend/plans/fiches/shared/labels';
import { Priorite } from '@/domain/plans/fiches';
import { Field, SelectFilter } from '@/ui';
import { PrioriteOrNot } from '../../data/use-fiches-filters-list/types';

const options: TOption[] = [
  { value: SANS_PRIORITE_LABEL, label: SANS_PRIORITE_LABEL },
  ...ficheActionNiveauPrioriteOptions,
];

export const PrioriteDropdown = ({
  values,
  onChange,
}: {
  values: PrioriteOrNot[];
  onChange: (values: PrioriteOrNot[]) => void;
}) => {
  const { getFilterLabel } = usePlanFilters();
  return (
    <Field title={getFilterLabel('priorites')}>
      <SelectFilter
        dataTest="filtre-priorite"
        values={values}
        options={options}
        onChange={({ values }) => onChange(values as PrioriteOrNot[])}
        customItem={(item) =>
          item.value === SANS_PRIORITE_LABEL ? (
            <span>Non priorisé</span>
          ) : (
            <BadgePriorite priorite={item.value as Priorite} />
          )
        }
        disabled={options.length === 0}
      />
    </Field>
  );
};
