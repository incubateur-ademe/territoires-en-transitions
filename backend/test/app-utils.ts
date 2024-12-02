import { ContextStoreService } from '@/backend/utils/context/context.service';
import { AllExceptionsFilter } from '@/backend/utils/nest/all-exceptions.filter';
import { CustomZodValidationPipe } from '@/backend/utils/nest/custom-zod-validation.pipe';
import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/utils/database/database.service';
import { TrpcRouter } from '../src/utils/trpc/trpc.router';

export const getTestApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  const contextStoreService = app.get(ContextStoreService);
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));
  app.useGlobalFilters(
    new AllExceptionsFilter(contextStoreService, httpAdapter)
  );

  await app.init();

  return app;
};

export async function getTestRouter(app?: INestApplication) {
  return (app ?? (await getTestApp())).get(TrpcRouter);
}

export async function getTestDatabase(app?: INestApplication) {
  return (app ?? (await getTestApp())).get(DatabaseService);
}
