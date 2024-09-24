import { Select, SelectProps } from '@tet/ui';
import { NiveauPriorite } from '@tet/api/plan-actions/fiche-resumes.list/domain/fiche-resumes.schema';
import { ficheActionNiveauPrioriteOptions } from 'ui/dropdownLists/listesStatiques';
import BadgePriorite from 'app/pages/collectivite/PlansActions/components/BadgePriorite';

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
