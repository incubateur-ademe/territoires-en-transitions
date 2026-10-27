/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, LoggerService, Optional } from '@nestjs/common';
import { pick } from 'es-toolkit';
import { Level, pino } from 'pino';
import type { Options } from 'pino-http';
import { ContextStoreService } from '../context/context.service';
import { Log } from './log.dto';
import {
  listErrorChain,
  maskParamsToEnd,
  redactErrorChain,
} from './redact-error-chain';

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

/** Causes imbriquées d'une erreur (déjà expurgée), de la première à la plus profonde. */
function describeCauses(error: Error): Record<string, unknown> | undefined {
  const chain = listErrorChain(error);
  const deepest = chain[chain.length - 1].cause;
  // Une cause qui est une Error ici est un cycle : on s'arrête. Une cause
  // d'un autre type peut porter n'importe quelle donnée : on n'en logue que
  // le type.
  let cause: Record<string, unknown> | undefined =
    deepest == null || deepest instanceof Error
      ? undefined
      : { type: typeof deepest };
  for (const e of chain.slice(1).reverse()) {
    cause = {
      name: e.name,
      message: e.message,
      ...pick(e as any, [...LOGGED_CAUSE_KEYS]),
      ...(cause && { cause }),
    };
  }
  return cause;
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
        redactErrorChain(message);
        let cause: Record<string, unknown> | undefined;
        try {
          cause = describeCauses(message);
        } catch {
          // cause exotique (objet sans prototype…) : l'erreur sans sa chaîne
        }
        objArg.error = {
          stack: message.stack,
          message: message.message,
          ...(cause !== undefined && { cause }),
        };
        objArg.message = objArg.error.message;
      } else {
        Object.assign(objArg, message);
      }
      this.logger[level](objArg, objArg.message, ...params);
    } else {
      // Erreur interpolée dans une chaîne (`${error}`, getErrorMessage) :
      // le texte se termine par les params, on coupe jusqu'au bout.
      this.logger[level](
        objArg,
        typeof message === 'string' ? maskParamsToEnd(message) : message,
        ...params
      );
    }
  }
}
