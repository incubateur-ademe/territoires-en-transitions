import { ZodValidationPipe } from '@anatine/zod-nestjs/src/lib/zod-validation-pipe';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { TrpcRouter } from '../../src/trpc/trpc.router';

export const getTestApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ZodValidationPipe());

  await app.init();

  return app;
};

export async function getTestRouter() {
  return (await getTestApp()).get(TrpcRouter);
}
