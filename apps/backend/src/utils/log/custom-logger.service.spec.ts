import { getTRPCErrorFromUnknown } from '@trpc/server';
import { pino } from 'pino';
import { ContextStoreService } from '../context/context.service';
import { CustomLogger } from './custom-logger.service';

describe('CustomLogger', () => {
  test("logue la chaîne de causes d'une erreur sans ses données personnelles", () => {
    const lines: string[] = [];
    const logger = new CustomLogger(
      { getContext: () => ({}) } as unknown as ContextStoreService,
      {},
      pino({}, { write: (line: string) => lines.push(line) })
    );

    const pgError = Object.assign(
      new Error(
        'duplicate key value violates unique constraint "dcp_email_key"'
      ),
      {
        code: '23505',
        detail: 'Key (email)=(a@b.fr) already exists.',
        constraint: 'dcp_email_key',
        table: 'dcp',
      }
    );
    const drizzleError = Object.assign(
      new Error('Failed query: insert into dcp', { cause: pgError }),
      { query: 'insert into dcp', params: ['a@b.fr'] }
    );

    logger.error(getTRPCErrorFromUnknown(drizzleError), 'Test');

    const { cause } = JSON.parse(lines[0]).error;
    expect(cause).toEqual({
      type: 'Error',
      message: 'Failed query: insert into dcp',
      cause: {
        type: 'Error',
        message:
          'duplicate key value violates unique constraint "dcp_email_key"',
        code: '23505',
        constraint: 'dcp_email_key',
        table: 'dcp',
      },
    });
  });
});
