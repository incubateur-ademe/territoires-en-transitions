import BadgePriorite from '@/app/ui/components/badges/BadgePriorite';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Priorite } from '@/domain/plans';
import { SelectFilter, SelectMultipleProps } from '@/ui';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: Priorite[];
  onChange: ({
    priorites,
    selectedPriorites,
  }: {
    priorites: Priorite[] | undefined;
    selectedPriorites: Priorite;
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
          priorites: values as Priorite[] | undefined,
          selectedPriorites: selectedValue as Priorite,
        })
      }
      customItem={(item) => <BadgePriorite priorite={item.value as Priorite} />}
    />
  );
};

export default PrioritesFilterDropdown;
