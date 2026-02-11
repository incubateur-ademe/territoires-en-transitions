import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';

type InstanceGouvernanceTagId = number;

export async function createInstanceGouvernanceTagAndCleanupFunction({
  caller,
  instanceGouvernanceTagInput,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  instanceGouvernanceTagInput: inferProcedureInput<
    AppRouter['collectivites']['tags']['instanceGouvernance']['create']
  >;
}): Promise<{
  instanceGouvernanceTagId: InstanceGouvernanceTagId;
  instanceGouvernanceTagCleanup: () => Promise<void>;
}> {
  const created = await caller.collectivites.tags.instanceGouvernance.create(
    instanceGouvernanceTagInput
  );
  const instanceGouvernanceTagId = created.id;

  const instanceGouvernanceTagCleanup = async () => {
    await caller.collectivites.tags.instanceGouvernance.delete({
      id: instanceGouvernanceTagId,
      collectiviteId: instanceGouvernanceTagInput.collectiviteId,
    });
  };

  return { instanceGouvernanceTagId, instanceGouvernanceTagCleanup };
}
