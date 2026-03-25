import { Field, Input } from '@tet/ui';
import { useRef } from 'react';
import { TFiltreProps } from '../filters';

export const FiltreDateDebut = ({ filters, setFilters }: TFiltreProps) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field title="Date de début" small>
      <Input
        ref={ref}
        displaySize="sm"
        type="date"
        data-test="filtre-start-date"
        value={filters.startDate || ''}
        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
      />
    </Field>
  );
};

export const FiltreDateFin = ({ filters, setFilters }: TFiltreProps) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field title="Date de fin" small>
      <Input
        ref={ref}
        displaySize="sm"
        type="date"
        data-test="filtre-end-date"
        value={filters.endDate || ''}
        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
      />
    </Field>
  );
};
