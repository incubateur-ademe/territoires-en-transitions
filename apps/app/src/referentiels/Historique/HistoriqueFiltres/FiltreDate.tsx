import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';
import { TFiltreProps } from '../filters';

export const FiltreDateDebut = ({ filters, setFilters }: TFiltreProps) => {
  return (
    <Field title={appLabels.dateDebut} small>
      <Input
        displaySize="sm"
        type="date"
        data-test="filtre-start-date"
        value={filters.startDate || ''}
        onChange={(e) => {
          if (e.target.value.length > 0) {
            return setFilters({ ...filters, startDate: e.target.value });
          } else {
            return setFilters({ ...filters, startDate: null });
          }
        }}
      />
    </Field>
  );
};

export const FiltreDateFin = ({ filters, setFilters }: TFiltreProps) => {
  return (
    <Field title={appLabels.dateFin} small>
      <Input
        displaySize="sm"
        type="date"
        data-test="filtre-end-date"
        value={filters.endDate || ''}
        onChange={(e) => {
          console.log(e.target.value.length);
          if (e.target.value.length > 0) {
            return setFilters({ ...filters, endDate: e.target.value });
          } else {
            return setFilters({ ...filters, endDate: null });
          }
        }}
      />
    </Field>
  );
};
