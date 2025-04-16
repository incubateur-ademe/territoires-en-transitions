import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ContextStoreService } from '@/backend/utils/context/context.service';
import { CustomLogger, getDefaultLoggerOptions } from '@/backend/utils/log/custom-logger.service';
import { NextFunction, Request, Response } from 'express';
import { CustomZodValidationPipe } from '@/backend/utils/nest/custom-zod-validation.pipe';
import { AllExceptionsFilter } from '@/backend/utils/nest/all-exceptions.filter';

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
  const port = process.env.PORT || 8082;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
