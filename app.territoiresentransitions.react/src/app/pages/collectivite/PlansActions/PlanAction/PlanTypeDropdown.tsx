import { usePlanTypeListe } from './data/usePlanTypeListe';
import { TPlanType } from 'types/alias';
import { Field, Select } from '@tet/ui';

type Props = {
  type?: number;
  onSelect: (type?: TPlanType) => void;
};

const PlanTypeDropdown = ({ type, onSelect }: Props) => {
  const { data: liste, options } = usePlanTypeListe();

  if (!liste) return null;

  return (
    <Field title="Type de plan d’action">
      <Select
        dataTest="Type"
        options={options ?? []}
        values={type}
        onChange={(value) => onSelect(liste.find((t) => t.id === value))}
      />
    </Field>
  );
};

export default PlanTypeDropdown;
