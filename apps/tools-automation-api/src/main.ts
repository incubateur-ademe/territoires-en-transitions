/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import {
  CustomLogger,
  getDefaultLoggerOptions,
} from '@/tools-automation-api/utils/log/custom-logger.service';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new CustomLogger(getDefaultLoggerOptions());
  app.useLogger(logger);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['version'],
  });
  app.use(json({ limit: '10mb' })); // Sentry payload can be large
  const port = process.env.PORT || 8081;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
