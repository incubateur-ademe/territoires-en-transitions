import { subDays } from 'date-fns';
import { z } from 'zod';

const modifiedSinceEnumValues = [
  'last-90-days',
  'last-60-days',
  'last-30-days',
  'last-15-days',
] as const;

export type ModifiedSince = (typeof modifiedSinceEnumValues)[number];

export const modifiedSinceSchema = z.enum(modifiedSinceEnumValues);

export const getModifiedSinceDate = (modifiedSince: ModifiedSince): string => {
  const now = new Date();
  switch (modifiedSince) {
    case 'last-90-days':
      return subDays(now, 90).toISOString();
    case 'last-60-days':
      return subDays(now, 60).toISOString();
    case 'last-30-days':
      return subDays(now, 30).toISOString();
    case 'last-15-days':
      return subDays(now, 15).toISOString();
  }
};


