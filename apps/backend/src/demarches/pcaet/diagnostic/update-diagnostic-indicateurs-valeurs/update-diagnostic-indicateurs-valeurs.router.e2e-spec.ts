import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import {
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
} from '../../demarches-pcaet.test-fixture';

describe('Mise à jour des valeurs du diagnostic PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshDemarche = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
    });
    return { collectiviteId: fixture.collectivite.id, caller, demarche };
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Écrire une valeur met à jour le diagnostic servi', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    await completeTestDiagnosticPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });

    const diagnosticAvant = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    const topic = diagnosticAvant.topics[0];
    const topicCode = topic.code;
    const cell =
      topic.valeurs.find((v) => v.resultat !== null) ?? topic.valeurs[0];

    const nextValue = 111;

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: demarche.id,
      valeurs: [
        {
          indicateurId: cell.indicateurId,
          year: cell.year,
          field: 'resultat',
          value: nextValue,
        },
      ],
    });

    const diagnosticApres = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    const topicApres = diagnosticApres.topics.find((t) => t.code === topicCode);
    expect(topicApres).toBeDefined();
    const cellApres = topicApres?.valeurs.find(
      (v) => v.indicateurId === cell.indicateurId && v.year === cell.year
    );

    expect(cellApres?.resultat).toBe(nextValue);
  });

  test("Refus quand le diagnostic n'est plus modifiable", async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    await completeTestDossierPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
        collectiviteId,
        demarcheId: demarche.id,
        valeurs: [
          {
            indicateurId: 1,
            year: 2021,
            field: 'resultat',
            value: 111,
          },
        ],
      })
    ).rejects.toThrow("n'est modifiable que pendant l'élaboration");
  });

  test("IDOR : la mutation n'est pas applicable via une autre collectivité", async () => {
    const { collectiviteId, demarche } = await freshDemarche();
    const autre = await freshDemarche();

    await completeTestDiagnosticPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      autre.caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
        collectiviteId: autre.collectiviteId,
        demarcheId: demarche.id,
        valeurs: [
          {
            indicateurId: 1,
            year: 2021,
            field: 'resultat',
            value: 111,
          },
        ],
      })
    ).rejects.toThrow("démarche PCAET demandée n'a pas été trouvée");
  });
});
