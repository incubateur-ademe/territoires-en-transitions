import type { FormFilters } from '../../types';
import { createDateFilterLabel } from '../create-date-filter-label';

describe('createDateFilterLabel', () => {
  it('returns label for both debutPeriode and finPeriode', () => {
    const startDateFilters: Partial<FormFilters> = {
      typePeriode: 'debut',
      debutPeriode: '2024-12-31',
      finPeriode: '2025-04-30',
    };
    const endDateFilters: Partial<FormFilters> = {
      typePeriode: 'fin',
      debutPeriode: '2024-12-31',
      finPeriode: '2025-04-30',
    };

    const creationFilters: Partial<FormFilters> = {
      typePeriode: 'creation',
      debutPeriode: '2024-12-31',
      finPeriode: '2025-04-30',
    };
    const modificationFilters: Partial<FormFilters> = {
      typePeriode: 'modification',
      debutPeriode: '2024-12-31',
      finPeriode: '2025-04-30',
    };

    expect(createDateFilterLabel(creationFilters as FormFilters)).toEqual(
      'Date de création entre le 31/12/2024 et le 30/04/2025'
    );
    expect(createDateFilterLabel(startDateFilters as FormFilters)).toEqual(
      'Date de début entre le 31/12/2024 et le 30/04/2025'
    );
    expect(createDateFilterLabel(endDateFilters as FormFilters)).toEqual(
      'Date de fin prévisionnelle entre le 31/12/2024 et le 30/04/2025'
    );
    expect(createDateFilterLabel(modificationFilters as FormFilters)).toEqual(
      'Date de modification entre le 31/12/2024 et le 30/04/2025'
    );
  });

  it('returns label for only debutPeriode', () => {
    const debutFilters: Partial<FormFilters> = {
      typePeriode: 'debut',
      debutPeriode: '2024-12-31',
      finPeriode: undefined,
    };
    const finFilters: Partial<FormFilters> = {
      typePeriode: 'fin',
      debutPeriode: '2024-12-31',
      finPeriode: undefined,
    };
    const creationFilters: Partial<FormFilters> = {
      typePeriode: 'creation',
      debutPeriode: '2024-12-31',
      finPeriode: undefined,
    };
    const modificationFilters: Partial<FormFilters> = {
      typePeriode: 'modification',
      debutPeriode: '2024-12-31',
      finPeriode: undefined,
    };

    expect(createDateFilterLabel(debutFilters as FormFilters)).toEqual(
      'Date de début à partir du 31/12/2024'
    );
    expect(createDateFilterLabel(finFilters as FormFilters)).toEqual(
      'Date de fin prévisionnelle à partir du 31/12/2024'
    );
    expect(createDateFilterLabel(creationFilters as FormFilters)).toEqual(
      'Date de création à partir du 31/12/2024'
    );
    expect(createDateFilterLabel(modificationFilters as FormFilters)).toEqual(
      'Date de modification à partir du 31/12/2024'
    );
  });

  it('returns label for only finPeriode', () => {
    const debutFilters: Partial<FormFilters> = {
      typePeriode: 'debut',
      debutPeriode: undefined,
      finPeriode: '2025-04-30',
    };
    const finFilters: Partial<FormFilters> = {
      typePeriode: 'fin',
      debutPeriode: undefined,
      finPeriode: '2025-04-30',
    };
    const creationFilters: Partial<FormFilters> = {
      typePeriode: 'creation',
      debutPeriode: undefined,
      finPeriode: '2025-04-30',
    };
    const modificationFilters: Partial<FormFilters> = {
      typePeriode: 'modification',
      debutPeriode: undefined,
      finPeriode: '2025-04-30',
    };

    expect(createDateFilterLabel(debutFilters as FormFilters)).toEqual(
      "Date de début allant jusqu'au 30/04/2025"
    );
    expect(createDateFilterLabel(finFilters as FormFilters)).toEqual(
      "Date de fin prévisionnelle allant jusqu'au 30/04/2025"
    );
    expect(createDateFilterLabel(creationFilters as FormFilters)).toEqual(
      "Date de création allant jusqu'au 30/04/2025"
    );
    expect(createDateFilterLabel(modificationFilters as FormFilters)).toEqual(
      "Date de modification allant jusqu'au 30/04/2025"
    );
  });

  it('returns null if typePeriode is missing', () => {
    const filters: Partial<FormFilters> = {
      typePeriode: undefined,
      debutPeriode: '2024-12-31',
      finPeriode: '2025-04-30',
    };
    expect(createDateFilterLabel(filters as FormFilters)).toBeNull();
  });

  it('returns null if both dates are missing', () => {
    const filters: Partial<FormFilters> = {
      typePeriode: 'debut',
      debutPeriode: undefined,
      finPeriode: undefined,
    };
    expect(createDateFilterLabel(filters as FormFilters)).toBeNull();
  });

  it('returns null if typePeriode is present but no dates', () => {
    const filters: Partial<FormFilters> = {
      typePeriode: 'debut',
      debutPeriode: undefined,
      finPeriode: undefined,
    };
    expect(createDateFilterLabel(filters as FormFilters)).toBeNull();
  });
});
