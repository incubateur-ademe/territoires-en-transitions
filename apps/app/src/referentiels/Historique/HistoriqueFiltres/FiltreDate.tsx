import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';
import { FiltreProps } from '../filters';

export const FiltreDateDebut = ({ filters, setFilters }: FiltreProps) => {
  return (
    <Field title={appLabels.dateDebut} small>
      <Input
        displaySize="sm"
        type="date"
        data-test="filtre-start-date"
        value={filters.startDate || ''}
        onChange={(e) => {
          const startDate = e.target.value.length > 0 ? e.target.value : null;
          setFilters({ startDate });
        }}
      />
    </Field>
  );
};

export const FiltreDateFin = ({ filters, setFilters }: FiltreProps) => {
  return (
    <Field title={appLabels.dateFin} small>
      <Input
        displaySize="sm"
        type="date"
        data-test="filtre-end-date"
        value={filters.endDate || ''}
        onChange={(e) => {
          const endDate = e.target.value.length > 0 ? e.target.value : null;
          setFilters({ endDate });
        }}
      />
    </Field>
  );
};
