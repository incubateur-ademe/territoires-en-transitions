import {
  Option,
  SelectFilter,
  SelectMultiple,
  SelectMultipleProps,
} from '@tet/ui';
import { generateTitle } from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { usePlansActionsListe } from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  type?: 'multiple' | 'filter';
  values?: number[];
  onChange: ({
    plans,
    selectedPlan,
  }: {
    plans?: number[];
    selectedPlan: number;
  }) => void;
};

const PlansActionDropdown = ({ type = 'filter', ...props }: Props) => {
  const { data } = usePlansActionsListe({});

  const plans = data?.plans;

  const options: Option[] = plans
    ? plans?.map((plan) => ({
        value: plan.id,
        label: generateTitle(plan.nom),
      }))
    : [];

  const sharedProps: SelectMultipleProps = {
    ...props,
    dataTest: props.dataTest ?? 'plans-action',
    values: props.values?.map((value) =>
      typeof value === 'string' ? parseInt(value) : value
    ),
    options,
    onChange: ({ values, selectedValue }) =>
      props.onChange({
        plans: values as number[],
        selectedPlan: selectedValue as number,
      }),
  };

  if (type === 'multiple') {
    return <SelectMultiple {...sharedProps} />;
  }

  return <SelectFilter {...sharedProps} />;
};

export default PlansActionDropdown;
