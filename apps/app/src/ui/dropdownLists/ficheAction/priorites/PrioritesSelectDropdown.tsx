import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Priorite } from '@tet/domain/plans';
import { Select, SelectProps } from '@tet/ui';

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
