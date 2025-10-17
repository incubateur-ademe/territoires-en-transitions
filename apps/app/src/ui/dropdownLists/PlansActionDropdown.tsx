import { useCollectiviteId } from '@/api/collectivites';
import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import {
  Option,
  SelectFilter,
  SelectMultiple,
  SelectMultipleProps,
} from '@/ui';

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
  const collectiviteId = useCollectiviteId();
  const { plans } = useListPlans(collectiviteId);

  const options: Option[] = plans.map((plan) => ({
    value: plan.id,
    label: generateTitle(plan.nom),
  }));

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
