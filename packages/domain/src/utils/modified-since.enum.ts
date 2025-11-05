import { DateTime } from 'luxon';
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
  const now = DateTime.now();
  switch (modifiedSince) {
    case 'last-90-days':
      return now.minus({ days: 90 }).toISO() as string;
    case 'last-60-days':
      return now.minus({ days: 60 }).toISO() as string;
    case 'last-30-days':
      return now.minus({ days: 30 }).toISO() as string;
    case 'last-15-days':
      return now.minus({ days: 15 }).toISO() as string;
  }
};


