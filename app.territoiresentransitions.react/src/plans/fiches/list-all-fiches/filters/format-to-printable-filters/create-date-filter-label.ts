import { typePeriodLabels } from '../labels';
import { FormFilters } from '../types';

const toDateString = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

export const createDateFilterLabel = (filters: FormFilters): string | null => {
  if (!filters.typePeriode || (!filters.debutPeriode && !filters.finPeriode)) {
    return null;
  }

  const typePeriodeLabel =
    typePeriodLabels[filters.typePeriode as keyof typeof typePeriodLabels] ??
    typePeriodLabels.creation;
  const title = `Date ${typePeriodeLabel}`;

  if (filters.debutPeriode && filters.finPeriode) {
    return `${title} entre le ${toDateString(
      filters.debutPeriode
    )} et le ${toDateString(filters.finPeriode)}`;
  }

  if (filters.debutPeriode) {
    return `${title} à partir du ${toDateString(filters.debutPeriode)}`;
  }

  if (filters.finPeriode) {
    return `${title} allant jusqu'au ${toDateString(filters.finPeriode)}`;
  }

  return title;
};
