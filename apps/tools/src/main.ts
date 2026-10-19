// WARNING: Do these imports first
import '@tet/backend/utils/telemetry-init';
// Other imports
import { configureHttpSecurity } from '@tet/backend/utils/nest/http-security';
import ConfigurationService from './config/configuration.service';
import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import {
  CustomLogger,
  getDefaultLoggerOptions,
} from '@tet/backend/utils/log/custom-logger.service';
import { AllExceptionsFilter } from '@tet/backend/utils/nest/all-exceptions.filter';
import { httpApplicationOptions } from '@tet/backend/utils/nest/http-application.options';
import {
  NestTelemetryInterceptor,
  traceNestBootstrap,
} from '@tet/backend/utils/nest/nest-telemetry';
import { SchemaValidationPipe } from '@tet/backend/utils/nest/schema-validation.pipe';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await traceNestBootstrap(AppModule.name, () =>
    NestFactory.create<NestExpressApplication>(
      AppModule,
      httpApplicationOptions
    )
  );
  const configuration = app.get(ConfigurationService);
  configureHttpSecurity(
    app,
    {
      APP_URL: configuration.get('APP_URL'),
      SITE_URL: configuration.get('SITE_URL'),
      HTTP_ALLOWED_ORIGINS: configuration.get('HTTP_ALLOWED_ORIGINS'),
      TRUST_PROXY_HOPS: configuration.get('TRUST_PROXY_HOPS'),
    },
    process.env.NODE_ENV === 'production'
  );
  app.enableShutdownHooks(['SIGTERM', 'SIGINT']);

  app.useGlobalInterceptors(new NestTelemetryInterceptor());
  const contextStoreService = app.get(ContextStoreService);
  const logger = new CustomLogger(
    contextStoreService,
    getDefaultLoggerOptions()
  );
  app.useLogger(logger);

  const withContextMiddleWare = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    contextStoreService.withContext(req, res, next);
  };
  app.use(withContextMiddleWare);

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalPipes(new SchemaValidationPipe(contextStoreService));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['version', 'health/live', 'health/ready'],
  });

  app.useGlobalFilters(
    new AllExceptionsFilter(contextStoreService, httpAdapter)
  );

  app.useBodyParser('json', { limit: '10mb' });
  // TOOLS_PORT prime sur PORT : en dev multi-apps (worktrees), PORT est
  // ambigu — backend et tools le lisent tous les deux dans un env partagé.
  const port = process.env.TOOLS_PORT || process.env.PORT || 8081;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
