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

  test('masque des params qui imitent une frame de stack', () => {
    const { logger, lines } = createLogger();

    const drizzleError = new DrizzleQueryError(
      'select from dcp where nom = $1',
      ['x\n    at fake (y)\nsecret@b.fr'],
      new Error('boom')
    );

    logger.error(getTRPCErrorFromUnknown(drizzleError), 'Test');

    expect(lines[0]).not.toContain('secret@b.fr');
    expect(lines[0]).not.toContain('fake (y)');
  });

  test('masque les params d’un message de requête sans DrizzleQueryError', () => {
    const { logger, lines } = createLogger();

    // Erreur recréée depuis le message : plus d'instance à reconnaître.
    const recreated = new Error(
      'Failed query: select from dcp\nparams: x\n    at fake (y)\nsecret@b.fr'
    );
    logger.error(new Error('Échec', { cause: recreated }), 'Test');
    logger.error(
      new Error('Échec', { cause: 'Failed query: q\nparams: string@b.fr' }),
      'Test'
    );

    expect(lines.join()).not.toMatch(/secret@b.fr|fake \(y\)|string@b.fr/);
    expect(JSON.parse(lines[0]).error.cause.message).toBe(
      'Failed query: select from dcp\nparams: [masqués]'
    );
  });

  test("logue une cause qui n'est pas une erreur", () => {
    const { logger, lines } = createLogger();

    logger.error(new Error('Échec', { cause: 'timeout' }), 'Test');

    expect(JSON.parse(lines[0]).error.cause).toEqual({ type: 'string' });
  });

  test("expurge l'erreur elle-même, pour PostHog et la réponse au client", () => {
    const { logger } = createLogger();
    const drizzleError = new DrizzleQueryError('q', ['a@b.fr'], new Error('x'));
    const trpcError = getTRPCErrorFromUnknown(drizzleError);

    logger.error(trpcError, 'Test');

    expect(trpcError.message).toBe('Failed query: q\nparams: [masqués]');
    expect(trpcError.stack).not.toContain('a@b.fr');
    expect(drizzleError.message).toBe('Failed query: q\nparams: [masqués]');
  });

  test('masque les params dans un message texte', () => {
    const { logger, lines } = createLogger();
    const drizzleError = new DrizzleQueryError('q', ['a@b.fr'], new Error('x'));

    logger.error(`Échec de la mise à jour : ${drizzleError}`, 'Test');

    expect(lines[0]).not.toContain('a@b.fr');
    expect(lines[0]).toContain('Failed query: q\\nparams: [masqués]');
  });

  test('masque la valeur citée par une erreur pg de classe 22', () => {
    const { logger, lines } = createLogger();
    const pgError = Object.assign(
      new Error('invalid input syntax for type uuid: "a@b.fr"'),
      { code: '22P02' }
    );

    logger.error(new Error('Échec', { cause: pgError }), 'Test');

    expect(lines[0]).not.toContain('a@b.fr');
    expect(JSON.parse(lines[0]).error.cause.message).toBe(
      'invalid input syntax for type uuid: "[masqué]"'
    );
  });

  test('masque une valeur de classe 22 qui contient un guillemet', () => {
    const { logger, lines } = createLogger();
    const pgError = Object.assign(
      new Error('invalid input syntax for type uuid: "a"secret@b.fr"'),
      { code: '22P02' }
    );

    logger.error(new Error('Échec', { cause: pgError }), 'Test');

    expect(lines[0]).not.toContain('secret@b.fr');
  });

  test("ne logue pas le contenu d'une cause textuelle", () => {
    const { logger, lines } = createLogger();

    logger.error(
      new Error('Échec', {
        cause: 'invalid input syntax for type uuid: "secret@b.fr"',
      }),
      'Test'
    );

    expect(lines[0]).not.toContain('secret@b.fr');
  });

  test('ne boucle pas sur une chaîne de causes cyclique', () => {
    const { logger, lines } = createLogger();
    const error = new Error('a');
    error.cause = error;

    logger.error(error, 'Test');

    expect(JSON.parse(lines[0]).error.message).toBe('a');
  });

  test('logue une erreur dont la cause ne se convertit pas en texte', () => {
    const { logger, lines } = createLogger();

    logger.error(new Error('Échec', { cause: Object.create(null) }), 'Test');

    expect(JSON.parse(lines[0]).error.message).toBe('Échec');
  });
});
