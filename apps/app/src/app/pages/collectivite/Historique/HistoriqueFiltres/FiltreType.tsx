import { appLabels } from '@/app/labels/catalog';
import { Field, SelectFilter } from '@tet/ui';
import { historiqueTypeEnumValues } from '@tet/domain/referentiels';
import { filtresTypeOptions, FiltreProps } from '../filters';

const FiltreType = ({ filters, setFilters }: FiltreProps) => {
  return (
    <Field title={appLabels.typeElementModifie} small>
      <SelectFilter
        small
        dataTest="filtre-type"
        values={filters.types ?? []}
        options={filtresTypeOptions}
        onChange={({ values }) => {
          if (values === undefined) {
            setFilters({ types: null });
            return;
          }
          setFilters({
            types: historiqueTypeEnumValues.filter((type) =>
              values.includes(type)
            ),
          });
        }}
      />
    </Field>
  );
};

export default FiltreType;
