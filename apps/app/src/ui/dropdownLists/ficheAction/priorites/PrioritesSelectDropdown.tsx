import BadgePriorite from '@/app/ui/components/badges/BadgePriorite';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Priorite } from '@/domain/plans';
import { Select, SelectProps } from '@/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Priorite | null;
  onChange: (priorite: Priorite) => void;
};

const PrioritesSelectDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'priorites'}
      options={ficheActionNiveauPrioriteOptions}
      onChange={(priorite) => props.onChange(priorite as Priorite)}
      customItem={(item) => <BadgePriorite priorite={item.value as Priorite} />}
    />
  );
};

export default PrioritesSelectDropdown;
