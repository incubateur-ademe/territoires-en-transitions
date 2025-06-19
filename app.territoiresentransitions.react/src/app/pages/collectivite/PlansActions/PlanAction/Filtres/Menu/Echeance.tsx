import { TFicheActionEcheances } from '@/app/types/alias';
import { Field, Select } from '@/ui';
import { ficheActionEcheanceOptions } from '../../../../../../../ui/dropdownLists/listesStatiques';
import { TFiltreProps } from '../../../FicheAction/data/filters';

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
