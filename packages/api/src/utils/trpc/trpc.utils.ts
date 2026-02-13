import { getErrorMessage } from '@tet/domain/utils';
import { loggerLink, Operation } from '@trpc/client';
import { ENV } from '../../environmentVariables';

export function getTrpcUrl() {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
  }/trpc`;
}

export const getTrpcLoggerLink = () =>
  loggerLink({
    enabled: (op) =>
      ENV.node_env === 'development' ||
      (op.direction === 'down' &&
        (op.result instanceof Error ||
          ('result' in op.result && 'error' in op.result.result))),

    logger(op) {
      if (op.direction === 'up' || !(op.result instanceof Error)) {
        return;
      }

      const correlationId = op.context.correlationId;
      console.error(
        `[${correlationId}] tRPC error for path ${
          op.path
        } with data ${JSON.stringify(op.result.data ?? {})}: ${getErrorMessage(
          op.result
        )}`
      );
    },
  });

export function setCorrelationIdInContextAndGetHeader({
  op,
}: {
  op: Operation;
}) {
  const correlationId = crypto.randomUUID();

  op.context = {
    ...(op.context ?? {}),
    correlationId,
  };

  return {
    'x-correlation-id': correlationId,
  };
}
