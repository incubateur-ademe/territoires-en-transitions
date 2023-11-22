import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {useServicePiloteListe} from '../../PlansActions/FicheAction/data/options/useServicePiloteListe';

type Props = {
  values: string[] | undefined;
  onSelect: (values: string[]) => void;
};

const FiltreServices = ({values, onSelect}: Props) => {
  const {data: servicesListe} = useServicePiloteListe();

  const options: TOption[] = servicesListe
    ? [
        {value: ITEM_ALL, label: 'Tous'},
        ...servicesListe.map(service => ({
          value: `${service.id}`,
          label: service.nom,
        })),
      ]
    : [];

  return (
    <AutocompleteInputSelect
      data-test="services"
      buttonClassName={DSFRbuttonClassname}
      values={values?.includes(ITEM_ALL) ? [] : values}
      options={options}
      onSelect={values => onSelect(values)}
    />
  );
};

export default FiltreServices;
