import { Statut } from '@/api/plan-actions';
import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { SelectFilter, SelectMultipleProps } from '@/ui';
import { ficheActionStatutOptions } from 'ui/dropdownLists/listesStatiques';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: Statut[];
  onChange: ({
    statuts,
    selectedStatut,
  }: {
    statuts: Statut[];
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
          statuts: values as Statut[],
          selectedStatut: selectedValue as Statut,
        })
      }
      customItem={(item) => <BadgeStatut statut={item.value as Statut} />}
    />
  );
};

export default StatutsFilterDropdown;
