import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { Statut } from '@tet/api/fiche_actions/fiche_resumes.list/domain/fiche_resumes.schema';
import { ficheActionStatutOptions } from 'ui/dropdownLists/listesStatiques';
import BadgeStatut from 'app/pages/collectivite/PlansActions/components/BadgeStatut';

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
