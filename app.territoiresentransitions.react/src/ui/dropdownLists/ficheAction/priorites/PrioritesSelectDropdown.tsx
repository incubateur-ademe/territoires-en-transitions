import { NiveauPriorite } from '@/api/plan-actions';
import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import { Select, SelectProps } from '@/ui';
import { ficheActionNiveauPrioriteOptions } from 'ui/dropdownLists/listesStatiques';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: NiveauPriorite | null;
  onChange: (priorite: NiveauPriorite) => void;
};

const PrioritesSelectDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'priorites'}
      options={ficheActionNiveauPrioriteOptions}
      onChange={(priorite) => props.onChange(priorite as NiveauPriorite)}
      customItem={(item) => (
        <BadgePriorite priorite={item.value as NiveauPriorite} />
      )}
    />
  );
};

export default PrioritesSelectDropdown;
