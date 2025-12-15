// WARNING: Do these imports first
import './utils/sentry-init';
// Other imports
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, NextFunction, Request, Response } from 'express';
import v8 from 'v8';
import { AppModule } from './app.module';
import { ContextRouteParametersInterceptor } from './utils/context/context-route-parameters.interceptor';
import { ContextStoreService } from './utils/context/context.service';
import { initGoogleCloudCredentials } from './utils/google-sheets/gcloud.helper';
import {
  CustomLogger,
  getDefaultLoggerOptions,
} from './utils/log/custom-logger.service';
import { AllExceptionsFilter } from './utils/nest/all-exceptions.filter';
import { ApiTrackingInterceptor } from './utils/tracking/api-tracking.interceptor';
import { TrpcRouter } from './utils/trpc/trpc.router';
import { CustomZodValidationPipe } from './utils/nest/custom-zod-validation.pipe';

const port = process.env.PORT || 8080;

async function bootstrap() {
  initGoogleCloudCredentials();

  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '5mb' }));
  const contextStoreService = app.get(ContextStoreService);

  const logger = new CustomLogger(
    contextStoreService,
    getDefaultLoggerOptions()
  );

  const heapSize = v8.getHeapStatistics().heap_size_limit / (1024 * 1024);
  logger.log(
    `Launching NestJS app on port ${port} with heap size ${heapSize}MB`
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
  app.useGlobalInterceptors(
    new ContextRouteParametersInterceptor(contextStoreService),
    app.get(ApiTrackingInterceptor)
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
    .setContact(
      'Equipe Territoires en Transitions',
      '',
      'contact@territoiresentransitions.fr'
    )
    .setDescription(
      "L'API de Territoires en Transitions permet de consulter les données (score d'état des lieux, indicateurs, etc.) disponible dans la plateforme mais également d'y ajouter des données (ajout de valeurs d'indicateurs). Elle est amenée à être enrichie au fure et à mesure des demandes afin d'exposer progressivement les fonctionnalités de la plateforme (ex. Plans, etc.). \n\nVous devez disposer d'un clé d'API rattachée à votre compte pour y accéder. Pour cela veuillez contacter le support via le chat ou par mail à l'adresse **contact@territoiresentransitions.fr**. Une fois ces identifiants obtenus, vous devez en premier lieu générer un token d'authentification (JWT) à l'aide de la route `api/v1/oauth/token`.\n\nA noter également que certaines routes nécessitent un droit d'écriture sur les collectivités visées (ex: ecriture de valeurs d'indicateur).\n\nVous pouvez consulter le guide de démarrage rapide sur le dépot GitHub [https://github.com/incubateur-ademe/territoires-en-transitions](https://github.com/incubateur-ademe/territoires-en-transitions/blob/main/backend/QuickstartApi.md)."
    )
    .setVersion(process.env.APPLICATION_VERSION || 'dev')
    .addBearerAuth({
      type: 'oauth2',
      flows: {
        clientCredentials: {
          tokenUrl: '/api/v1/oauth/token',
          scopes: {},
        },
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs/v1', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
    },
  });

  // Configure tRPC
  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);

  await app.listen(port);
}

bootstrap();
