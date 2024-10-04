import { Select, SelectProps } from '@tet/ui';
import { ficheActionNiveauPrioriteOptions } from 'ui/dropdownLists/listesStatiques';
import BadgePriorite from 'app/pages/collectivite/PlansActions/components/BadgePriorite';
import { NiveauPriorite } from '@tet/api/plan-actions';

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
