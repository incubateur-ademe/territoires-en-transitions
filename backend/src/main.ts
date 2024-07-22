// WARNING: Do this import first
import './common/services/sentry.service';
import * as Sentry from '@sentry/nestjs';
import {
  BaseExceptionFilter,
  HttpAdapterHost,
  NestFactory,
} from '@nestjs/core';
import { AppModule } from './app.module';
import { SENTRY_DSN } from './common/services/sentry.service';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

const logger = new Logger('main');
const port = process.env.PORT || 8080;
logger.log(`Launching NestJS app on port ${port}`);

async function bootstrap() {
  if (process.env.GCLOUD_SERVICE_ACCOUNT_KEY) {
    const serviceAccountFile = `${__dirname}/keyfile.json`;
    logger.log('Writing Google Cloud credentials to file:', serviceAccountFile);
    fs.writeFileSync(
      serviceAccountFile,
      process.env.GCLOUD_SERVICE_ACCOUNT_KEY,
    );
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountFile;
  }

  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  // Seulement une v1 pour l'instant
  app.setGlobalPrefix('api/v1', {
    exclude: ['version'],
  });

  if (SENTRY_DSN) {
    logger.log('Sentry enabled with DSN: ', SENTRY_DSN);
    Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter));
  }

  await app.listen(port);
}
bootstrap();
