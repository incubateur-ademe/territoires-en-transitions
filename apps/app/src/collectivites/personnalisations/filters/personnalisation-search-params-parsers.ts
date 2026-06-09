'use client';

import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
} from 'nuqs';

export const personnalisationFiltersSearchParamsParser = {
  thematiqueIds: parseAsArrayOf(parseAsString),
  referentielIds: parseAsArrayOf(parseAsString),
  actionIds: parseAsArrayOf(parseAsString),
} as const;

export const openedThematiquesSearchParamsParser = {
  openedThematiques: parseAsArrayOf(parseAsString).withDefault([]),
  autoOpenThematiques: parseAsBoolean.withDefault(false),
} as const;
