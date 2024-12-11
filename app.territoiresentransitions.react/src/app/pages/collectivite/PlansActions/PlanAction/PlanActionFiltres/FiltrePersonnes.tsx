import { Field, OptionValue, SelectFilter } from '@/ui';
import { usePersonneListe } from 'ui/dropdownLists/PersonnesDropdown/usePersonneListe';
import { getPersonneStringId } from 'ui/dropdownLists/PersonnesDropdown/utils';
import { TOption } from 'ui/shared/select/commons';
import {
  SANS_PILOTE,
  SANS_REFERENT,
  TFilters,
  TFiltreProps,
} from '../../FicheAction/data/filters';

type Props = TFiltreProps & {
  label: string;
  filterKey: keyof TFilters;
  dataTest?: string;
};

const FiltrePersonnes = ({
  label,
  filterKey,
  filters,
  setFilters,
  dataTest,
}: Props) => {
  const { data: personnes } = usePersonneListe();

  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [];

  if (filterKey === 'pilotes') {
    options.push({
      value: SANS_PILOTE,
      label: 'Sans pilote',
    });
  }

  if (filterKey === 'referents') {
    options.push({
      value: SANS_REFERENT,
      label: 'Sans élu·e référent·e',
    });
  }

  // Transformation et ajout des personnes aux options
  personnes &&
    personnes.forEach((personne) =>
      options.push({
        value: getPersonneStringId(personne),
        label: personne.nom!,
      })
    );

  // Renvoie les bonnes valeurs en fonction du filtre personne utlisé
  const values = (): string[] => {
    if (filterKey === 'pilotes') {
      if (filters.sans_pilote && filters.sans_pilote === 1) {
        return [SANS_PILOTE];
      } else {
        return filters.pilotes || [];
      }
    }
    if (filterKey === 'referents') {
      if (filters.sans_referent && filters.sans_referent === 1) {
        return [SANS_REFERENT];
      } else {
        return filters.referents || [];
      }
    }

    return [];
  };

  // onSelect en fonction du filtre personne utilisé
  const onSelect = (newValues?: OptionValue[]) => {
    const newFilters = filters;
    const newPersonnes = personnes
      ?.filter((p) => newValues?.includes(getPersonneStringId(p)))
      .map((p) => getPersonneStringId(p));

    // onClick "tous" ou toggle option
    if (newValues === undefined) {
      delete newFilters.sans_referent;
      delete newFilters.sans_pilote;
      if (filterKey === 'referents') {
        delete newFilters.referents;
      }
      if (filterKey === 'pilotes') {
        delete newFilters.pilotes;
      }
      return { ...newFilters };
    }
    if (filterKey === 'pilotes') {
      if (newValues.includes(SANS_PILOTE)) {
        if (filters.sans_pilote === 1) {
          delete newFilters.sans_pilote;
          return { ...newFilters, [filterKey]: newPersonnes };
        } else {
          delete newFilters.pilotes;
          return { ...newFilters, sans_pilote: 1 };
        }
      } else {
        return {
          ...newFilters,
          [filterKey]: newPersonnes,
        };
      }
    }
    if (filterKey === 'referents') {
      if (newValues.includes(SANS_REFERENT)) {
        if (filters.sans_referent === 1) {
          delete newFilters.sans_referent;
          return { ...newFilters, [filterKey]: newPersonnes };
        } else {
          delete newFilters.referents;
          return { ...newFilters, sans_referent: 1 };
        }
      } else {
        return {
          ...newFilters,
          [filterKey]: newPersonnes,
        };
      }
    }
    return newFilters;
  };

  return (
    <Field title={label}>
      <SelectFilter
        dataTest={dataTest}
        values={values()}
        options={options}
        onChange={({ values }) => setFilters(onSelect(values))}
        disabled={options.length === 0}
        isSearcheable
      />
    </Field>
  );
};

export default FiltrePersonnes;
