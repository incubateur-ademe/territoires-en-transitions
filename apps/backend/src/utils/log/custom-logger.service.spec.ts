import { getTRPCErrorFromUnknown } from '@trpc/server';
import { DrizzleQueryError } from 'drizzle-orm';
import { pino } from 'pino';
import { ContextStoreService } from '../context/context.service';
import { CustomLogger } from './custom-logger.service';

function createLogger() {
  const lines: string[] = [];
  const logger = new CustomLogger(
    { getContext: () => ({}) } as unknown as ContextStoreService,
    {},
    pino({}, { write: (line: string) => lines.push(line) })
  );
  return { logger, lines };
}

describe('CustomLogger', () => {
  test("logue la chaîne de causes d'une erreur sans ses données personnelles", () => {
    const { logger, lines } = createLogger();

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
    const drizzleError = new DrizzleQueryError(
      'insert into dcp',
      ['a@b.fr', 'Jean'],
      pgError
    );

    logger.error(getTRPCErrorFromUnknown(drizzleError), 'Test');

    const line = lines[0];
    expect(line).not.toContain('a@b.fr');
    expect(line).not.toContain('Jean');

    const { error } = JSON.parse(line);
    expect(error.message).toBe(
      'Failed query: insert into dcp\nparams: [masqués]'
    );
    expect(error.stack).toMatch(
      /^Error: Failed query: insert into dcp\nparams: \[masqués\]\n {4}at /
    );
    expect(error.cause).toEqual({
      name: 'Error',
      message: 'Failed query: insert into dcp\nparams: [masqués]',
      cause: {
        name: 'Error',
        message:
          'duplicate key value violates unique constraint "dcp_email_key"',
        code: '23505',
        constraint: 'dcp_email_key',
        table: 'dcp',
      },
    });
  });

  test("logue une cause qui n'est pas une erreur", () => {
    const { logger, lines } = createLogger();

    logger.error(new Error('Échec', { cause: 'timeout' }), 'Test');

    expect(JSON.parse(lines[0]).error.cause).toEqual({ message: 'timeout' });
  });
});
