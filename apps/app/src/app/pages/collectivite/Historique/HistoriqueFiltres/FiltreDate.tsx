import { appLabels } from '@/app/labels/catalog';
import { Field, Input } from '@tet/ui';
import { useRef } from 'react';
import { FiltreProps } from '../filters';

export const FiltreDateDebut = ({ filters, setFilters }: FiltreProps) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field title={appLabels.dateDebut} small>
      <Input
        ref={ref}
        displaySize="sm"
        type="date"
        data-test="filtre-start-date"
        value={filters.startDate || ''}
        onChange={(e) => setFilters({ startDate: e.target.value })}
      />
    </Field>
  );
};

export const FiltreDateFin = ({ filters, setFilters }: FiltreProps) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field title={appLabels.dateFin} small>
      <Input
        ref={ref}
        displaySize="sm"
        type="date"
        data-test="filtre-end-date"
        value={filters.endDate || ''}
        onChange={(e) => setFilters({ endDate: e.target.value })}
      />
    </Field>
  );
};
