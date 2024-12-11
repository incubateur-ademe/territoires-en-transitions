import { NiveauPriorite } from '@/api/plan-actions';
import { SelectFilter, SelectMultipleProps } from '@/ui';
import BadgePriorite from 'app/pages/collectivite/PlansActions/components/BadgePriorite';
import { ficheActionNiveauPrioriteOptions } from 'ui/dropdownLists/listesStatiques';

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
