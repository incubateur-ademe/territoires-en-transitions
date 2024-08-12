import { Select, SelectProps } from '@tet/ui';
import { Statut } from '@tet/api/fiche_actions/fiche_resumes.list/domain/fiche_resumes.schema';
import { ficheActionStatutOptions } from 'ui/dropdownLists/listesStatiques';
import BadgeStatut from 'app/pages/collectivite/PlansActions/components/BadgeStatut';

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
