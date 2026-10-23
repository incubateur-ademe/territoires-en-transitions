/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, LoggerService, Optional } from '@nestjs/common';
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
// Le message d'une erreur Drizzle se termine par `\nparams: <valeurs>` : on
// coupe jusqu'à la fin du message, ou jusqu'aux frames dans une stack.
const QUERY_PARAMS_PATTERN = /\nparams: [\s\S]*?(?=\n {4}at |$)/;

function redactQueryParams<T extends string | undefined>(text: T): T {
  return text?.replace(QUERY_PARAMS_PATTERN, '\nparams: [masqués]') as T;
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

function pickCause(cause: unknown): Record<string, unknown> | undefined {
  if (cause === undefined || cause === null) {
    return undefined;
  }
  if (!(cause instanceof Error)) {
    return { message: redactQueryParams(String(cause)) };
  }
  const nested = pickCause(cause.cause);
  return {
    name: cause.name,
    message: redactQueryParams(cause.message),
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
        const cause = pickCause(message.cause);
        objArg.error = {
          stack: redactQueryParams(message.stack),
          message: redactQueryParams(message.message),
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
