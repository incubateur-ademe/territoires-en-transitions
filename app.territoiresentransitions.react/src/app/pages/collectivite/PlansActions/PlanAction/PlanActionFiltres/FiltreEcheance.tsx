import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {ficheActionEcheanceOptions} from '../../../../../../ui/dropdownLists/listesStatiques';
import SelectDropdown from 'ui/shared/select/SelectDropdown';
import {TFicheActionEcheances} from 'types/alias';

const FiltreEcheance = ({filters, setFilters}: TFiltreProps) => {
  const {echeance} = filters;

  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [
    {value: ITEM_ALL, label: 'Tous'},
    ...ficheActionEcheanceOptions,
  ];

  return (
    <FilterField title="Échéance">
      <SelectDropdown
        data-test="filtre-echeance"
        value={Array.isArray(echeance) ? echeance[0] : echeance}
        options={options}
        onSelect={(value: TFicheActionEcheances) => {
          // onClick "tous" ou toggle option
          if (getIsAllSelected([value]) || !value) {
            const newFilters = filters;
            delete newFilters.echeance;
            setFilters({...newFilters});
            // d'une option à l'autre
          } else {
            setFilters({...filters, echeance: value});
          }
        }}
        placeholderText="Sélectionner des options"
        disabled={options.length === 0}
      />
    </FilterField>
  );
};

export default FiltreEcheance;
