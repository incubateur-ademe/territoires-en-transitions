import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PreuveLabellisation } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { TRPCClient } from '@trpc/client';
import TestAgent from 'supertest/lib/agent';

export async function createTestDemandePreuve(
  trpcClient: TRPCClient<AppRouter>,
  testAgent: TestAgent,
  token: string,
  collectiviteId: number,
  referentiel: ReferentielId,
  document?: {
    fileName?: string;
    sampleFileName?: string;
    confidentiel?: boolean;
  }
): Promise<PreuveLabellisation> {
  const parcours =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId: collectiviteId,
      referentielId: referentiel,
    });

  if (!parcours.demande) {
    throw new Error('No demande found');
  }

  const createdDocument = await uploadCreateTestDocument({
    collectiviteId,
    testAgent,
    token,
    fileName: document?.fileName ?? 'test-preuve.pdf',
    sampleFileName: document?.sampleFileName,
    confidentiel: document?.confidentiel,
  });

  const demandePreuve =
    await trpcClient.referentiels.labellisations.createLabellisationPreuve.mutate(
      {
        demandeId: parcours.demande.id,
        fichierId: createdDocument.id,
        commentaire: '',
      }
    );

  return demandePreuve;
}
