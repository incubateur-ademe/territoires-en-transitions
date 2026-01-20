import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import VersionService from '@tet/backend/utils/version/version.service';
import { createTRPCClient, TRPCClient } from '@trpc/client';
import { observable } from '@trpc/server/observable';

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

/**
 * Creates a TRPCClient from a caller for use in tests.
 * This allows functions that expect a TRPCClient to work with a caller.
 * The caller is used directly without HTTP overhead, making tests faster.
 */
export function createTRPCClientFromCaller(
  caller: ReturnType<TrpcRouter['createCaller']>
): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [
      () =>
        ({ op }) => {
          return observable((observer) => {
            // Navigate through the caller object using the path
            // e.g., "referentiels.snapshots.getCurrent" -> caller.referentiels.snapshots.getCurrent
            // Note: Caller procedures are callable directly, unlike TRPCClient which uses .query()/.mutate()
            const pathParts = op.path.split('.');
            
            try {
              // Navigate through the path to get the procedure
              let current: any = caller;
              
              for (const part of pathParts) {
                if (current == null) {
                  throw new Error(
                    `Path "${op.path}" not found in caller. Cannot access "${part}" on null/undefined.`
                  );
                }
                
                // Access the property (handles proxies)
                const value = current[part];
                
                if (value === undefined) {
                  throw new Error(
                    `Path "${op.path}" not found in caller. Part "${part}" is undefined.`
                  );
                }
                
                current = value;
              }

              // Caller procedures are callable directly (not .query() or .mutate())
              // The procedure itself is the function to call
              if (typeof current !== 'function') {
                throw new Error(
                  `Path "${op.path}" resolved to a non-function. Expected a procedure function but got ${typeof current}.`
                );
              }

              // Call the procedure directly with the input
              const promise = current(op.input);

              promise
                .then((data: unknown) => {
                  observer.next({ result: { data } });
                  observer.complete();
                })
                .catch((error: unknown) => {
                  // Pass through the error as-is - it should already be a TRPCClientError
                  // when coming from the caller
                  observer.error(error as any);
                });
            } catch (error: unknown) {
              observer.error(error as any);
            }
          });
        },
    ],
  });
}
