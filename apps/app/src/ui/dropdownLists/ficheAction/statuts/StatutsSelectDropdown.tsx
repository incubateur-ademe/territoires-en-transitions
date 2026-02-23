import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Statut } from '@tet/domain/plans';
import { BadgeSize, Select, SelectProps } from '@tet/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Statut | null;
  onChange: (statut: Statut) => void;
  badgeSize?: BadgeSize;
};

const StatutsSelectDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'statuts'}
      options={ficheActionStatutOptions}
      onChange={(statut) => props.onChange(statut as Statut)}
      placeholder="Sélectionner un statut"
      customItem={(item) => (
        <BadgeStatut statut={item.value as Statut} size={props.badgeSize} />
      )}
    />
  );
};

export default StatutsSelectDropdown;
