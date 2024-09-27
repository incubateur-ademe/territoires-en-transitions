import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { NiveauPriorite } from '@tet/api/fiche_actions/fiche_resumes.list/domain/fiche_resumes.schema';
import { ficheActionNiveauPrioriteOptions } from 'ui/dropdownLists/listesStatiques';
import BadgePriorite from 'app/pages/collectivite/PlansActions/components/BadgePriorite';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: NiveauPriorite[];
  onChange: ({
    priorites,
    selectedPriorites,
  }: {
    priorites: NiveauPriorite[];
    selectedPriorites: NiveauPriorite;
  }) => void;
};

const PrioritesFilterDropdown = (props: Props) => {
  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'priorites'}
      options={ficheActionNiveauPrioriteOptions}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          priorites: values as NiveauPriorite[],
          selectedPriorites: selectedValue as NiveauPriorite,
        })
      }
      customItem={(item) => (
        <BadgePriorite priorite={item.value as NiveauPriorite} />
      )}
    />
  );
};

export default PrioritesFilterDropdown;
