import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import VersionService from '@tet/backend/utils/version/version.service';

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
