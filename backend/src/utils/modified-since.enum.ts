import { DateTime } from 'luxon';
import { z } from 'zod';

export enum ModifiedSinceEnum {
  LAST_90_DAYS = 'last-90-days',
  LAST_60_DAYS = 'last-60-days',
  LAST_30_DAYS = 'last-30-days',
  LAST_15_DAYS = 'last-15-days',
}

export const modifiedSinceSchema = z.enum([
  ModifiedSinceEnum.LAST_90_DAYS,
  ModifiedSinceEnum.LAST_60_DAYS,
  ModifiedSinceEnum.LAST_30_DAYS,
  ModifiedSinceEnum.LAST_15_DAYS,
]);

export const getModifiedSinceDate = (
  modifiedSince: ModifiedSinceEnum
): string => {
  const now = DateTime.now();
  switch (modifiedSince) {
    case ModifiedSinceEnum.LAST_90_DAYS:
      return now.minus({ days: 90 }).toISO() as string;
    case ModifiedSinceEnum.LAST_60_DAYS:
      return now.minus({ days: 60 }).toISO() as string;
    case ModifiedSinceEnum.LAST_30_DAYS:
      return now.minus({ days: 30 }).toISO() as string;
    case ModifiedSinceEnum.LAST_15_DAYS:
      return now.minus({ days: 15 }).toISO() as string;
  }
};
