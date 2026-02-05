/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, LoggerService, Optional } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
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

    const traceId = Sentry.getActiveSpan()?.spanContext()?.traceId;
    if (traceId) {
      objArg.trace_id = traceId;
    }

    // context name / logger name is the last item
    let params: any[] = [];
    if (optionalParams.length !== 0) {
      objArg.logger = { name: optionalParams[optionalParams.length - 1] };
      params = optionalParams.slice(0, -1);
    }

    if (typeof message === 'object') {
      if (message instanceof Error) {
        objArg.error = {
          stack: message.stack,
          message: message.message,
        };
        objArg.message = message.message;
      } else {
        Object.assign(objArg, message);
      }
      this.logger[level](objArg, objArg.message, ...params);
    } else {
      this.logger[level](objArg, message, ...params);
    }
  }
}
