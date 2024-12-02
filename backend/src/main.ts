// WARNING: Do these imports first
import './utils/sentry-init';
// Other imports
import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { ContextRouteParametersInterceptor } from './utils/context/context-route-parameters.interceptor';
import { ContextStoreService } from './utils/context/context.service';
import { initGoogleCloudCredentials } from './utils/google-sheets/gcloud.helper';
import {
  CustomLogger,
  getDefaultLoggerOptions,
} from './utils/log/custom-logger.service';
import { AllExceptionsFilter } from './utils/nest/all-exceptions.filter';
import { CustomZodValidationPipe } from './utils/nest/custom-zod-validation.pipe';
import { TrpcRouter } from './utils/trpc/trpc.router';

const port = process.env.PORT || 8080;

async function bootstrap() {
  initGoogleCloudCredentials();

  const app = await NestFactory.create(AppModule);
  const contextStoreService = app.get(ContextStoreService);
  const logger = new CustomLogger(
    contextStoreService,
    getDefaultLoggerOptions()
  );
  logger.log(`Launching NestJS app on port ${port}`);
  app.useLogger(logger);
  const withContextMiddleWare = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    contextStoreService.withContext(req, res, next);
  };
  app.use(withContextMiddleWare);
  app.useGlobalInterceptors(
    new ContextRouteParametersInterceptor(contextStoreService)
  );

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.enableCors();

  app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));

  // Seulement une v1 pour l'instant
  app.setGlobalPrefix('api/v1', {
    exclude: ['version', 'throw'],
  });

  app.useGlobalFilters(
    new AllExceptionsFilter(contextStoreService, httpAdapter)
  );

  const config = new DocumentBuilder()
    .setTitle('Api Territoires en Transitions')
    .setVersion(process.env.APPLICATION_VERSION || 'dev')
    .build();
  patchNestjsSwagger();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs/v1', app, document);

  // Configure tRPC
  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);

  await app.listen(port);
}

bootstrap();
