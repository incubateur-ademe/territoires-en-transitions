import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { cloneDeep, merge } from 'es-toolkit';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { COLLECTIVITE_ID_PARAM_KEY } from '../../collectivites/collectivite-api.constants';
import { REFERENTIEL_ID_PARAM_KEY } from '../../referentiels/models/referentiel-api.constants';
import { ApplicationContext } from './application-context.dto';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class ContextStoreService {
  private readonly globalStore = new AsyncLocalStorage<ApplicationContext>();

  getContext(): ApplicationContext {
    const context = this.globalStore.getStore();
    if (!context) {
      return this.getDefaultContext();
    }
    // Return a copy of the context to prevent unwanted modifications
    return cloneDeep(context);
  }

  updateContext(obj: Partial<ApplicationContext>): void {
    const context = this.globalStore.getStore();
    if (context) {
      // Use Object.assign to modify the original store
      merge(context, obj);
    }
  }

  autoSetContextFromPayload(payload: any) {
    if (!payload) {
      return;
    }
    const contextUpdate: Partial<ApplicationContext> = {};
    if (
      payload[COLLECTIVITE_ID_PARAM_KEY] &&
      (typeof payload[COLLECTIVITE_ID_PARAM_KEY] === 'number' ||
        typeof payload[COLLECTIVITE_ID_PARAM_KEY] === 'string')
    ) {
      const parsedCollectiviteId = parseInt(
        payload[COLLECTIVITE_ID_PARAM_KEY] as string
      );
      if (!isNaN(parsedCollectiviteId)) {
        if (!contextUpdate.scope) {
          contextUpdate.scope = {};
        }
        contextUpdate.scope.collectiviteId = parsedCollectiviteId;
      }
    }

    if (
      payload[REFERENTIEL_ID_PARAM_KEY] &&
      typeof payload[REFERENTIEL_ID_PARAM_KEY] === 'string'
    ) {
      if (!contextUpdate.scope) {
        contextUpdate.scope = {};
      }
      contextUpdate.scope.referentielId = payload[REFERENTIEL_ID_PARAM_KEY];
    }

    const keys = Object.keys(contextUpdate);
    if (keys.length > 0) {
      this.updateContext(contextUpdate);
    }
  }

  private getDefaultContext(): ApplicationContext {
    const defaultContext: ApplicationContext = {
      source: 'nestjs',
      service: process.env.APPLICATION_NAME || 'backend',
      version: process.env.APPLICATION_VERSION || 'dev',
      environment: process.env.ENV_NAME || 'local',
      scope: {},
    };
    return defaultContext;
  }

  async withContext(_req: Request, _res: Response, next: NextFunction) {
    const context = this.getDefaultContext();
    context.requestPath = _req.baseUrl + (_req.path ?? '');

    if (_req.header(CORRELATION_ID_HEADER)) {
      context.correlationId = _req.header(CORRELATION_ID_HEADER) as string;
    }

    if (!context.correlationId) {
      context.correlationId = uuidv4();
    }
    _res.setHeader(CORRELATION_ID_HEADER, context.correlationId);

    return this.globalStore.run(context, () => next());
  }
}
