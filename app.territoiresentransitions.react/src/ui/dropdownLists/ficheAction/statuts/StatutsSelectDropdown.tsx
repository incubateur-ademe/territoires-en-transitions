import { Statut } from '@/api/plan-actions';
import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { Select, SelectProps } from '@/ui';
import { ficheActionStatutOptions } from 'ui/dropdownLists/listesStatiques';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Statut | null;
  onChange: (statut: Statut) => void;
};

const StatutsSelectDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'statuts'}
      options={ficheActionStatutOptions}
      onChange={(statut) => props.onChange(statut as Statut)}
      customItem={(item) => <BadgeStatut statut={item.value as Statut} />}
    />
  );
};

export default StatutsSelectDropdown;
