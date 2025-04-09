// WARNING: Do these imports first
import '@/backend/utils/sentry-init';
// Other imports
import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';

import { ContextStoreService } from '@/backend/utils/context/context.service';
import {
  CustomLogger,
  getDefaultLoggerOptions,
} from '@/backend/utils/log/custom-logger.service';
import { AllExceptionsFilter } from '@/backend/utils/nest/all-exceptions.filter';
import { CustomZodValidationPipe } from '@/backend/utils/nest/custom-zod-validation.pipe';
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
  const port = process.env.PORT || 8081;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
