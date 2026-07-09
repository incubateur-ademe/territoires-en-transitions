// WARNING: Do these imports first
import '@tet/backend/utils/sentry-init';
// Other imports
import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';

import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import {
  CustomLogger,
  getDefaultLoggerOptions,
} from '@tet/backend/utils/log/custom-logger.service';
import { AllExceptionsFilter } from '@tet/backend/utils/nest/all-exceptions.filter';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { json, NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  app.enableCors();
  app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['version'],
  });

  app.useGlobalFilters(
    new AllExceptionsFilter(contextStoreService, httpAdapter)
  );

  app.use(json({ limit: '10mb' })); // Sentry payload can be large
  // TOOLS_PORT prime sur PORT : en dev multi-apps (worktrees), PORT est
  // ambigu — backend et tools le lisent tous les deux dans un env partagé.
  const port = process.env.TOOLS_PORT || process.env.PORT || 8081;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
