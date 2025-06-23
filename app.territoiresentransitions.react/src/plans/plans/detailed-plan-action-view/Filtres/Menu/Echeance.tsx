import { TFiltreProps } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFichesActionFiltresListe';
import { TFicheActionEcheances } from '@/app/types/alias';
import { ficheActionEcheanceOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Field, Select } from '@/ui';

const FiltreEcheance = ({ filters, setFilters }: TFiltreProps) => {
  const { echeance } = filters;

  return (
    <Field title="Échéance">
      <Select
        dataTest="filtre-echeance"
        values={Array.isArray(echeance) ? echeance[0] : echeance}
        options={ficheActionEcheanceOptions}
        onChange={(value) => {
          if (value) {
            return setFilters({
              ...filters,
              echeance: value as TFicheActionEcheances,
            });
          }
          delete filters.echeance;
          setFilters({ ...filters });
        }}
      />
    </Field>
  );
};

export default FiltreEcheance;
