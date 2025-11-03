import BadgeStatut from '@/app/ui/components/badges/BadgeStatut';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Statut } from '@/domain/plans';
import { SelectFilter, SelectMultipleProps } from '@/ui';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: Statut[];
  onChange: ({
    statuts,
    selectedStatut,
  }: {
    statuts: Statut[] | undefined;
    selectedStatut: Statut;
  }) => void;
};

const StatutsFilterDropdown = (props: Props) => {
  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'statuts'}
      options={ficheActionStatutOptions}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          statuts: values as Statut[] | undefined,
          selectedStatut: selectedValue as Statut,
        })
      }
      customItem={(item) => <BadgeStatut statut={item.value as Statut} />}
    />
  );
};

export default StatutsFilterDropdown;
