import { DateTime } from 'luxon';
import { expect } from 'vitest';

export const ISO_8601_DATE_TIME_REGEX =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

export interface CustomMatchers<R = string> {
  toEqualDate: (expected: string) => R;
}

expect.extend({
  // Examples:
  //
  // expect('2024-01-01').toEqualDate('2024-01-01');
  // expect('2024-12-17 16:29:13.02+00').toEqualDate('2024-12-17T16:29:13.020Z');
  //
  // expect({ date: '2024-12-17 16:29:13.02+00' }).toEqual({
  //   date: expect.toEqualDate('2024-12-17T16:29:13.020Z'),
  // });
  toEqualDate: (received: string, expected: string) => {
    const receivedDate = DateTime.fromJSDate(new Date(received));
    const expectedDate = DateTime.fromJSDate(new Date(expected));

    if (receivedDate.toISO() !== expectedDate.toISO()) {
      return {
        message: () =>
          `Expected ${received} to be the same date as ${expected}`,
        pass: false,
      };
    }

    return {
      message: () => `Expected ${received} to be the same date as ${expected}`,
      pass: true,
    };
  },
});
