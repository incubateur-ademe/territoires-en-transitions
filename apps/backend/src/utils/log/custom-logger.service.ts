/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, LoggerService, Optional } from '@nestjs/common';
import { DrizzleQueryError } from 'drizzle-orm';
import { pick } from 'es-toolkit';
import { Level, pino } from 'pino';
import type { Options } from 'pino-http';
import { ContextStoreService } from '../context/context.service';
import { Log } from './log.dto';

export const getDefaultLoggerOptions = (): Options => {
  return {
    messageKey: process.env.NODE_ENV === 'production' ? 'message' : 'msg',
    level: 'info',
    formatters:
      process.env.NODE_ENV === 'production'
        ? {
            bindings(bindings) {
              return { host: bindings.hostname };
            },
            level: (label, number) => {
              return {
                severity_number: number,
                status: label,
              };
            },
          }
        : undefined,
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined // Default configuration to console in json
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
            },
          },
  };
};
/**
 * Masque les paramètres des requêtes Drizzle en échec de la chaîne.
 *
 * Le message d'un DrizzleQueryError est `Failed query: <requête>\nparams:
 * <valeurs>`, recopié tel quel par les erreurs qui l'enveloppent (TRPCError :
 * message et stack). On le remplace à l'identique, reconstruit depuis
 * `query` : les valeurs, saisies par l'utilisateur, ne sont jamais analysées.
 */
const PARAMS_MARKER = '\nparams: ';

// Coupe jusqu'à la fin du texte : appliqué à un message seul, jamais à une
// stack, où la fin des params ne se repère pas sans analyser les valeurs.
function maskParamsToEnd(message: string) {
  const index = message.indexOf(PARAMS_MARKER);
  return index === -1
    ? message
    : `${message.slice(0, index)}${PARAMS_MARKER}[masqués]`;
}

function buildQueryParamsRedactor(error: Error) {
  const replacements: [string, string][] = [];
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    if (e instanceof DrizzleQueryError) {
      replacements.push([
        e.message,
        `Failed query: ${e.query}\nparams: [masqués]`,
      ]);
    } else if (e.message.includes(PARAMS_MARKER)) {
      // Filet : message de requête sans DrizzleQueryError reconnaissable
      // (autre copie de drizzle-orm, erreur recréée depuis le message).
      replacements.push([e.message, maskParamsToEnd(e.message)]);
    }
  }
  return <T extends string | undefined>(text: T): T =>
    replacements.reduce<string | undefined>(
      (redacted, [original, replacement]) =>
        redacted?.split(original).join(replacement),
      text
    ) as T;
}

// Liste fermée : les autres propriétés des causes peuvent porter des données
// personnelles (`params` / `query` de Drizzle, `detail` de pg).
const LOGGED_CAUSE_KEYS = [
  'code',
  'severity',
  'table',
  'column',
  'constraint',
  'routine',
] as const;

function pickCause(
  cause: unknown,
  redact: (text: string) => string
): Record<string, unknown> | undefined {
  if (cause === undefined || cause === null) {
    return undefined;
  }
  if (!(cause instanceof Error)) {
    return { message: maskParamsToEnd(redact(String(cause))) };
  }
  const nested = pickCause(cause.cause, redact);
  return {
    name: cause.name,
    message: redact(cause.message),
    ...pick(cause as any, [...LOGGED_CAUSE_KEYS]),
    ...(nested && { cause: nested }),
  };
}

/**
 * Use a custom logger instead of https://github.com/iamolegga/nestjs-pino/tree/master
 * In order to have full control on the context
 */
@Injectable()
export class CustomLogger implements LoggerService {
  constructor(
    private readonly contextStoreService: ContextStoreService,
    private readonly config: Options,
    @Optional() private logger = pino(config)
  ) {}

  verbose(message: any, ...optionalParams: any[]) {
    this.call('trace', message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.call('debug', message, ...optionalParams);
  }

  log(message: any, ...optionalParams: any[]) {
    this.call('info', message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.call('warn', message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.call('error', message, ...optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]) {
    this.call('fatal', message, ...optionalParams);
  }

  private call(level: Level, message: any, ...optionalParams: any[]) {
    const objArg: Log = this.contextStoreService.getContext();
    if (objArg.userId) {
      objArg.posthogDistinctId = objArg.userId;
    }

    // context name / logger name is the last item
    let params: any[] = [];
    if (optionalParams.length !== 0) {
      objArg.logger = { name: optionalParams[optionalParams.length - 1] };
      params = optionalParams.slice(0, -1);
    }

    if (typeof message === 'object') {
      if (message instanceof Error) {
        // La cause porte l'erreur d'origine (ex. l'erreur pg sous un
        // "Failed query" de Drizzle, elle-même sous une TRPCError).
        const redact = buildQueryParamsRedactor(message);
        const cause = pickCause(message.cause, redact);
        objArg.error = {
          stack: redact(message.stack),
          message: redact(message.message),
          ...(cause !== undefined && { cause }),
        };
        objArg.message = objArg.error.message;
      } else {
        Object.assign(objArg, message);
      }
      this.logger[level](objArg, objArg.message, ...params);
    } else {
      this.logger[level](objArg, message, ...params);
    }
  }
}
