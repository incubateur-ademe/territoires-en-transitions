import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Statut } from '@/domain/plans/fiches';
import { Select, SelectProps } from '@/ui';

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
