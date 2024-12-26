// WARNING: Do this import first
import './utils/sentry-init';
// Other imports
import { patchNestjsSwagger, ZodValidationPipe } from '@anatine/zod-nestjs';
import { Logger } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initGoogleCloudCredentials } from './utils/google-sheets/gcloud.helper';
import { AllExceptionsFilter } from './utils/nest/all-exceptions.filter';
import { TrpcRouter } from './utils/trpc/trpc.router';

const logger = new Logger('main');
const port = process.env.PORT || 8080;
logger.log(`Launching NestJS app on port ${port}`);

async function bootstrap() {
  initGoogleCloudCredentials();

  const app = await NestFactory.create(AppModule, {
    logger: ['fatal', 'error', 'warn', 'log'], // No debug by default
  });
  const { httpAdapter } = app.get(HttpAdapterHost);

  app.enableCors();

  // TODO: configure validation
  app.useGlobalPipes(new ZodValidationPipe());

  // Seulement une v1 pour l'instant
  app.setGlobalPrefix('api/v1', {
    exclude: ['version'],
  });

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

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
