import { HttpException } from '@nestjs/common';
import { HttpExceptionDto } from '@tet/backend/utils/nest/http-exception.dto';
import { TRPCError } from '@trpc/server';
import { DateTime } from 'luxon';
import { expect } from 'vitest';

export const ISO_8601_DATE_TIME_REGEX =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

export const ISO_8601_DATE_REGEX = /\d{4}-[01]\d-[0-3]\d/;

export interface CustomMatchers<R = unknown> {
  toEqualDate: (expected: string) => R;
  toThrowTrpcHttpError: (error: HttpException) => Promise<R>;
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
    const receivedDate = received.includes(' ')
      ? DateTime.fromSQL(received)
      : DateTime.fromISO(received);
    const expectedDate = expected.includes(' ')
      ? DateTime.fromSQL(expected)
      : DateTime.fromISO(expected);

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

  async toThrowTrpcHttpError(
    received: () => Promise<any>,
    expectedException: HttpException
  ) {
    let err: TRPCError;
    let receivedHttpException: HttpExceptionDto | null = null;

    const expectedExceptionDto: HttpExceptionDto = {
      message: expectedException.message,
      name: expectedException.name,
      status: expectedException.getStatus(),
    };

    try {
      await received();
    } catch (error) {
      err = error as TRPCError;
      if (error instanceof TRPCError) {
        console.log(`TRPCError`);
        console.log(JSON.stringify(error));
      } else {
        return {
          pass: false,
          message: () => 'Not a TRPCError',
        };
      }

      receivedHttpException = err.cause as unknown as HttpExceptionDto;
    }

    if (this.isNot) {
      return {
        pass: false,
        message: () => 'Not supposed to be used with not',
      };
    } else {
      let pass = false;
      let error: Error | null = null;

      try {
        expect(receivedHttpException).toMatchObject(expectedExceptionDto);
        pass = true;
      } catch (e) {
        pass = false;
        error = e as Error;
      }

      return {
        pass,
        message: () =>
          pass
            ? ''
            : error?.message ?? 'Error to match expected http exception',
      };
    }
  },
});
