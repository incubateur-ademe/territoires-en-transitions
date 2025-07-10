import { WITH, WithOrWithoutOptions, WITHOUT } from './options';
import { Filters, FormFilters } from './types';

const fromWithOrWithoutToBoolean = (
  value: WithOrWithoutOptions | undefined
): boolean | undefined => {
  if (value === undefined) return undefined;
  return value === WITH ? true : false;
};

const fromBooleanToWithOrWithout = (
  value?: boolean
): WithOrWithoutOptions | undefined => {
  if (value === undefined) return undefined;
  return value ? WITH : WITHOUT;
};

const sanitizeFiltersComingFromURLParameters = (
  paramFilters: Filters
): Filters => {
  const filters = { ...paramFilters };

  // Helper function to convert array to single value
  const convertArrayToSingle = (value: any) =>
    Array.isArray(value) ? value[0] : value;

  // Helper function to convert string array to boolean
  const convertStringArrayToBoolean = (value: any) => {
    if (!Array.isArray(value)) return value;
    const stringValue = value[0];
    return stringValue === undefined ? undefined : stringValue === 'true';
  };

  // Convert array values to single values for date-related fields
  const dateFields = [
    'modifiedSince',
    'debutPeriode',
    'finPeriode',
    'typePeriode',
  ] as const;
  dateFields.forEach((field) => {
    filters[field] = convertArrayToSingle(filters[field]);
  });

  // Convert boolean fields from string arrays to booleans
  const booleanFields = [
    'restreint',
    'doesBelongToSeveralPlans',
    'noPriorite',
    'noTag',
    'noStatut',
    'noReferent',
    'noServicePilote',
    'noPilote',
    'ameliorationContinue',
  ] as const;
  booleanFields.forEach((field) => {
    filters[field] = convertStringArrayToBoolean(filters[field]);
  });

  return filters;
};

export const filtersConverter = {
  fromFormFormatToApiFormat: (formFilters: Partial<FormFilters>): Filters => {
    return {
      ...formFilters,
      hasIndicateurLies: fromWithOrWithoutToBoolean(
        formFilters.hasIndicateurLies
      ),
      hasNoteDeSuivi: fromWithOrWithoutToBoolean(formFilters.hasNoteDeSuivi),
      hasMesuresLiees: fromWithOrWithoutToBoolean(formFilters.hasMesuresLiees),
      hasDateDeFinPrevisionnelle: fromWithOrWithoutToBoolean(
        formFilters.hasDateDeFinPrevisionnelle
      ),
    };
  },
  fromApiFormatToFormFormat: (apiFilters: Filters): FormFilters => {
    return {
      ...sanitizeFiltersComingFromURLParameters(apiFilters),
      hasIndicateurLies: fromBooleanToWithOrWithout(
        apiFilters.hasIndicateurLies
      ),
      hasNoteDeSuivi: fromBooleanToWithOrWithout(apiFilters.hasNoteDeSuivi),
      hasMesuresLiees: fromBooleanToWithOrWithout(apiFilters.hasMesuresLiees),
      hasDateDeFinPrevisionnelle: fromBooleanToWithOrWithout(
        apiFilters.hasDateDeFinPrevisionnelle
      ),
    };
  },
};
