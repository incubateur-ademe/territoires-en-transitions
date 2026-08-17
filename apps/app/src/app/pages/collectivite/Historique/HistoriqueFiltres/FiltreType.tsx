import { appLabels } from '@/app/labels/catalog';
import { Field, SelectFilter } from '@tet/ui';
import { filtresTypeOptions, FilterType, FiltreProps } from '../filters';

const FiltreType = ({ filters, setFilters }: FiltreProps) => {
  return (
    <Field title={appLabels.typeElementModifie} small>
      <SelectFilter
        small
        dataTest="filtre-type"
        values={filters.types ?? []}
        options={filtresTypeOptions}
        onChange={({ values }) =>
          setFilters({
            types: values === undefined ? null : (values as FilterType[]),
          })
        }
      />
    </Field>
  );
};

export default FiltreType;
