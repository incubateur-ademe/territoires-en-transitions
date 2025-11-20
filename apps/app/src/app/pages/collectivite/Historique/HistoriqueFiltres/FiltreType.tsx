import { Field, SelectFilter } from '@tet/ui';
import { filtresTypeOptions, TFilterType, TFiltreProps } from '../filters';

const FiltreType = ({ filters, setFilters }: TFiltreProps) => {
  return (
    <Field title="Type d'élément modifié">
      <SelectFilter
        dataTest="filtre-type"
        values={filters.types}
        options={filtresTypeOptions}
        onChange={({ values }) => {
          if (values === undefined) {
            delete filters.types;
            return setFilters({ ...filters });
          } else {
            return setFilters({ ...filters, types: values as TFilterType[] });
          }
        }}
      />
    </Field>
  );
};

export default FiltreType;
