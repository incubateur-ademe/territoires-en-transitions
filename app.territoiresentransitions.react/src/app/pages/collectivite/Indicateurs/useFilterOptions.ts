import {ITEM_ALL} from 'ui/shared/filters/commons';
import {TOption} from 'ui/shared/select/commons';
import {useIndicateursNonRemplis} from './useIndicateurDefinitions';
import {TIndicateurDefinition} from './types';

export const ITEM_A_COMPLETER = 'ac';

type TDefinitionFilterPredicate = (d: TIndicateurDefinition) => boolean;

// les listes d'options sont séparées, suivant qu'il y a ou non plus d'un
// indicateur correspondant à l'option de filtrage
type TOptionsListWithCounters = {
  options: TOption[];
  optionsWithoutResults: TOption[];
};

/** Fourni des fonctions permettant de gérer les options de filtrage */
export const useFilterOptions = ({
  definitions,
  defaultOptionLabel,
}: {
  definitions: TIndicateurDefinition[];
  defaultOptionLabel: string;
}) => {
  const nonRemplis = useIndicateursNonRemplis(definitions);

  // sous-ensembles et options par défaut ("tous" et "à compléter")
  const valueToSubset: Record<string, TIndicateurDefinition[]> = {
    [ITEM_ALL]: definitions,
    [ITEM_A_COMPLETER]: nonRemplis,
  };
  const optionsList: TOption[] = [
    {value: ITEM_ALL, label: defaultOptionLabel},
    {value: ITEM_A_COMPLETER, label: 'À compléter'},
  ];

  // ajoute une option de filtrage et le sous-ensemble correspondant
  const addOption = (
    option: TOption,
    filterPredicate: TDefinitionFilterPredicate,
    externalOptionsList?: TOption[]
  ) => {
    valueToSubset[option.value] = definitions.filter(filterPredicate);
    (externalOptionsList || optionsList).push(option);
  };

  // idem mais insère à la position donnée
  const insertOption = (
    index: number,
    option: TOption,
    filterPredicate: TDefinitionFilterPredicate
  ) => {
    valueToSubset[option.value] = definitions.filter(filterPredicate);
    optionsList.splice(index, 0, option);
  };

  // ajoute les compteurs aux libellés des options de filtrage et scinde les
  // options associées à des résultats de celles sans résultat
  const getOptionsWithCounters = () =>
    optionsList.reduce(
      (acc, {value, label}) => {
        const {options, optionsWithoutResults} = acc;
        const definitions = valueToSubset[value];
        if (definitions?.length) {
          options.push({value, label: `${label} (${definitions.length})`});
        } else {
          optionsWithoutResults.push({value, label: `${label} (0)`});
        }

        return {options, optionsWithoutResults};
      },
      {options: [], optionsWithoutResults: []} as TOptionsListWithCounters
    );

  // renvoi les définitions correspondant à la sélection de filtres
  const applyFilters = (selectedValues: string[]) => {
    // aucun filtre
    if (selectedValues.includes(ITEM_ALL)) {
      return definitions;
    }

    // un seul filtre
    if (selectedValues.length === 1) {
      const subset = valueToSubset[selectedValues[0]];
      if (subset) return subset;
    }

    // agrège les sous-ensembles correspondants à la sélection de filtres et dédoublonne
    const uniqIds = [
      ...new Set(
        selectedValues?.flatMap(
          value => valueToSubset[value]?.map(({id}) => id) || []
        )
      ),
    ];

    // renvoi la sélection
    return definitions.filter(({id}) => uniqIds.includes(id));
  };

  return {
    addOption,
    insertOption,
    getOptionsWithCounters,
    applyFilters,
  };
};
