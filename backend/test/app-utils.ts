import { ContextStoreService } from '@/backend/utils/context/context.service';
import { CustomZodValidationPipe } from '@/backend/utils/nest/custom-zod-validation.pipe';
import VersionService from '@/backend/utils/version/version.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/utils/database/database.service';
import { TrpcRouter } from '../src/utils/trpc/trpc.router';

export const getTestApp = async (options?: {
  mockProdEnv?: boolean;
}): Promise<INestApplication> => {
  const moduleRefPromise = await Test.createTestingModule({
    imports: [AppModule],
  });

  if (options?.mockProdEnv) {
    moduleRefPromise.overrideProvider(VersionService).useValue({
      getVersion: () => {
        return { environment: 'prod' };
      },
    });
  }

  const moduleRef = await moduleRefPromise.compile();

  const app = moduleRef.createNestApplication();
  const contextStoreService = app.get(ContextStoreService);
  app.useGlobalPipes(new CustomZodValidationPipe(contextStoreService));

  await app.init();

  return app;
};

export async function getTestRouter(app?: INestApplication) {
  return (app ?? (await getTestApp())).get(TrpcRouter);
}

export async function getTestDatabase(app?: INestApplication) {
  return (app ?? (await getTestApp())).get(DatabaseService);
}
