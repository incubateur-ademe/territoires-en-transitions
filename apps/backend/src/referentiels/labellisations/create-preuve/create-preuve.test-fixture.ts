import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  BibliothequeFichier,
  PreuveLabellisation,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { TRPCClient } from '@trpc/client';
import fs from 'fs';
import path from 'path';
import TestAgent from 'supertest/lib/agent';

const TEST_PDF_PATH = path.join(
  __dirname,
  '../../../collectivites/documents/samples/document_test.pdf'
);

export async function createTestDemandePreuve(
  trpcClient: TRPCClient<AppRouter>,
  testAgent: TestAgent,
  token: string,
  collectiviteId: number,
  referentiel: ReferentielId
): Promise<PreuveLabellisation> {
  const parcours =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId: collectiviteId,
      referentielId: referentiel,
    });

  if (!parcours.demande) {
    throw new Error('No demande found');
  }

  const testPdfBuffer = fs.readFileSync(TEST_PDF_PATH);
  const fileName = 'test.pdf';
  const response = await testAgent
    .post(`/collectivites/${collectiviteId}/documents/upload`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', testPdfBuffer, fileName)
    .field('confidentiel', 'false')
    .expect(201);
  const createdDocument: BibliothequeFichier = response.body;

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
