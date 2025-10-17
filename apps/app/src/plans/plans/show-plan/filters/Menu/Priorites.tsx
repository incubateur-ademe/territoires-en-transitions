import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { TOption } from '@/app/ui/shared/select/commons';
import { Priorite, SANS_PRIORITE_LABEL } from '@/domain/plans';
import { Field, SelectFilter } from '@/ui';
import { PrioriteOrNot } from '../../data/use-fiches-filters-list/types';

const options: TOption[] = [
  { value: SANS_PRIORITE_LABEL, label: SANS_PRIORITE_LABEL },
  ...ficheActionNiveauPrioriteOptions,
];

export const PrioriteDropdown = ({
  values,
  onChange,
  title,
}: {
  values: PrioriteOrNot[];
  onChange: (values: PrioriteOrNot[]) => void;
  title: string;
}) => {
  return (
    <Field title={title}>
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
