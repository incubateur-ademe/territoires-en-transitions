import { TOption } from 'ui/shared/select/commons';
import { SANS_STATUT, TFiltreProps } from '../../FicheAction/data/filters';
import { ficheActionStatutOptions } from '../../../../../../ui/dropdownLists/listesStatiques';
import BadgeStatut from '../../components/BadgeStatut';
import { TFicheActionStatuts } from 'types/alias';
import { Field, OptionValue, SelectFilter } from '@tet/ui';
import { Statut } from '@tet/api/plan-actions';

const FiltreStatuts = ({ filters, setFilters }: TFiltreProps) => {
  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [
    { value: SANS_STATUT, label: 'Sans statut' },
    ...ficheActionStatutOptions,
  ];

  const selectStatut = (newStatuts?: OptionValue[]) => {
    const newFilters = filters;
    const statuts = newStatuts?.filter((s) => s !== SANS_STATUT);

    if (newStatuts === undefined) {
      delete newFilters.sans_statut;
      delete newFilters.statuts;
      return { ...newFilters };
    } else if (newStatuts.includes(SANS_STATUT)) {
      if (filters.sans_statut === 1) {
        delete newFilters.sans_statut;
        return { ...newFilters, statuts: statuts as TFicheActionStatuts[] };
      } else {
        delete newFilters.statuts;
        return { ...newFilters, sans_statut: 1 };
      }
    } else {
      return { ...newFilters, statuts: statuts as TFicheActionStatuts[] };
    }
  };

  return (
    <Field title="Statut">
      <SelectFilter
        dataTest="filtre-statut"
        values={
          filters.sans_statut && filters.sans_statut === 1
            ? [SANS_STATUT]
            : filters.statuts
        }
        options={options}
        onChange={({ values }) => setFilters(selectStatut(values))}
        customItem={(item) =>
          item.value === SANS_STATUT ? (
            <span>Sans statut</span>
          ) : (
            <BadgeStatut statut={item.value as Statut} />
          )
        }
        disabled={options.length === 0}
      />
    </Field>
  );
};

export default FiltreStatuts;
