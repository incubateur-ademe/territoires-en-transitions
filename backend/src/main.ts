// WARNING: Do this import first
import { patchNestjsSwagger, ZodValidationPipe } from '@anatine/zod-nestjs';
import { Logger } from '@nestjs/common';
import {
  BaseExceptionFilter,
  HttpAdapterHost,
  NestFactory,
} from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { AppModule } from './app.module';
import { initApplicationCredentials } from './common/services/gcloud.helper';
import './common/services/sentry.service';
import { SENTRY_DSN } from './common/services/sentry.service';
import { TrpcRouter } from './trpc.router';

const logger = new Logger('main');
const port = process.env.PORT || 8080;
logger.log(`Launching NestJS app on port ${port}`);

async function bootstrap() {
  initApplicationCredentials();

  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  app.enableCors();

  // TODO: configure validation
  app.useGlobalPipes(new ZodValidationPipe());

  // Seulement une v1 pour l'instant
  app.setGlobalPrefix('api/v1', {
    exclude: ['version'],
  });

  if (SENTRY_DSN) {
    logger.log('Sentry enabled with DSN: ', SENTRY_DSN);
    Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter));
  }

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
