// WARNING: Do this import first
import './common/configs/SentryInit';
import * as Sentry from '@sentry/nestjs';
import {
  BaseExceptionFilter,
  HttpAdapterHost,
  NestFactory,
} from '@nestjs/core';
import { AppModule } from './app.module';
import { SENTRY_DSN } from './common/configs/SentryInit';

const port = process.env.PORT || 8080;
console.log(`Launching NestJS app on port ${port}`);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  if (SENTRY_DSN) {
    console.log('Sentry enabled with DSN:', SENTRY_DSN);
    Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter));
  }

  await app.listen(port);
}
bootstrap();
