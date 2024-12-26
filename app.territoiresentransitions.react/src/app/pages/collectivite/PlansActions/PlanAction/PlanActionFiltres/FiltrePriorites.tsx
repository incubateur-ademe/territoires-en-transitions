import { TOption } from '@/app/ui/shared/select/commons';
import { Priorite } from '@/domain/plans/fiches';
import { Field, OptionValue, SelectFilter } from '@/ui';
import { ficheActionNiveauPrioriteOptions } from '../../../../../../ui/dropdownLists/listesStatiques';
import BadgePriorite from '../../components/BadgePriorite';
import { SANS_PRIORITE, TFiltreProps } from '../../FicheAction/data/filters';

const FiltrePriorites = ({ filters, setFilters }: TFiltreProps) => {
  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [
    { value: SANS_PRIORITE, label: 'Non priorisé' },
    ...ficheActionNiveauPrioriteOptions,
  ];

  const selectPriorite = (newPriorites?: OptionValue[]) => {
    const newFilters = filters;
    const priorites = newPriorites?.filter((p) => p !== SANS_PRIORITE);

    if (newPriorites === undefined) {
      delete newFilters.sans_niveau;
      delete newFilters.priorites;
      return { ...newFilters };
    } else if (newPriorites.includes(SANS_PRIORITE)) {
      if (filters.sans_niveau === 1) {
        delete newFilters.sans_niveau;
        return {
          ...newFilters,
          priorites: priorites as Priorite[],
        };
      } else {
        delete newFilters.priorites;
        return { ...newFilters, sans_niveau: 1 };
      }
    } else {
      return {
        ...newFilters,
        priorites: priorites as Priorite[],
      };
    }
  };

  return (
    <Field title="Niveau de priorité">
      <SelectFilter
        dataTest="filtre-priorite"
        values={
          filters.sans_niveau && filters.sans_niveau === 1
            ? [SANS_PRIORITE]
            : filters.priorites
        }
        options={options}
        onChange={({ values }) => setFilters(selectPriorite(values))}
        customItem={(item) =>
          item.value === SANS_PRIORITE ? (
            <span>Non priorisé</span>
          ) : (
            <BadgePriorite priorite={item.value as Priorite} />
          )
        }
        disabled={options.length === 0}
      />
    </Field>
  );
};

export default FiltrePriorites;
