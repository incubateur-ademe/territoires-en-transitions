import { TPlanType } from '@/app/types/alias';
import { Field, FieldProps, Select } from '@/ui';
import { usePlanTypeListe } from '../../../app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';

interface Props extends Omit<FieldProps, 'children'> {
  type?: number;
  onSelect: (type?: TPlanType) => void;
}

export const PlanTypeDropdown = ({ type, onSelect, ...props }: Props) => {
  const title = props.title ?? 'Type de plan d’action';
  const { data: liste, options } = usePlanTypeListe();

  if (!liste) return null;

  return (
    <Field title={title} {...props}>
      <Select
        dataTest="Type"
        options={options ?? []}
        values={type}
        onChange={(value) => onSelect(liste.find((t) => t.id === value))}
      />
    </Field>
  );
};
