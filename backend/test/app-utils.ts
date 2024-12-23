import { ZodValidationPipe } from '@anatine/zod-nestjs/src/lib/zod-validation-pipe';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import DatabaseService from '../src/common/services/database.service';
import { TrpcRouter } from '../src/utils/trpc/trpc.router';

export const getTestApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ZodValidationPipe());

  await app.init();

  return app;
};

export async function getTestRouter(app?: INestApplication) {
  return (app ?? (await getTestApp())).get(TrpcRouter);
}

export async function getTestDatabase(app?: INestApplication) {
  return (app ?? (await getTestApp())).get(DatabaseService);
}
