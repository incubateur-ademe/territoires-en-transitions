import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { getYearFromIsoDate } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import {
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
} from '../../demarches-pcaet.test-fixture';

describe("Bascule de l'année de référence du diagnostic PCAET", () => {
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

  const getIndicateurId = async (referentielId: string): Promise<number> => {
    const [definition] = await db.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(
        eq(indicateurDefinitionTable.identifiantReferentiel, referentielId)
      );
    if (!definition) {
      throw new Error(`Indicateur ${referentielId} absent du référentiel`);
    }
    return definition.id;
  };

  const listResultats = async (
    caller: ReturnType<typeof router.createCaller>,
    {
      collectiviteId,
      demarcheId,
      indicateurId,
    }: { collectiviteId: number; demarcheId: number; indicateurId: number }
  ) => {
    const diagnostic = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId,
    });

    return diagnostic.indicateurValeurs
      .filter(
        ({ indicateurValeur }) => indicateurValeur.indicateurId === indicateurId
      )
      .map(({ indicateurValeur }) => ({
        year: getYearFromIsoDate(indicateurValeur.dateValeur),
        resultat: indicateurValeur.resultat,
      }));
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Les valeurs suivent la nouvelle année de référence', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: demarche.id,
      valeurs: [
        { indicateurId, year: 2019, field: 'resultat', value: 42 },
        { indicateurId, year: 2030, field: 'objectif', value: 10 },
      ],
    });

    await caller.demarches.pcaet.diagnostic.indicateurs.setReferenceYear({
      collectiviteId,
      demarcheId: demarche.id,
      indicateurIds: [indicateurId],
      fromYear: 2019,
      toYear: 2021,
    });

    const resultats = await listResultats(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      indicateurId,
    });

    expect(resultats).toEqual(
      expect.arrayContaining([{ year: 2021, resultat: 42 }])
    );
    expect(resultats.map(({ year }) => year)).not.toContain(2019);
    // L'objectif posé sur un horizon ne bouge pas avec l'année de référence.
    expect(resultats.map(({ year }) => year)).toContain(2030);
  });

  test("Une saisie déjà présente sur l'année visée est écrasée, sans doublon", async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: demarche.id,
      valeurs: [
        { indicateurId, year: 2018, field: 'resultat', value: 7 },
        { indicateurId, year: 2021, field: 'resultat', value: 42 },
      ],
    });

    await caller.demarches.pcaet.diagnostic.indicateurs.setReferenceYear({
      collectiviteId,
      demarcheId: demarche.id,
      indicateurIds: [indicateurId],
      fromYear: 2021,
      toYear: 2018,
    });

    const resultats = await listResultats(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      indicateurId,
    });

    expect(resultats).toEqual([{ year: 2018, resultat: 42 }]);
  });

  test('Seuls les indicateurs du tableau basculent', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const basculeId = await getIndicateurId('cae_1.c');
    const intactId = await getIndicateurId('cae_1.d');

    await caller.demarches.pcaet.diagnostic.indicateurs.updateValeurs({
      collectiviteId,
      demarcheId: demarche.id,
      valeurs: [
        { indicateurId: basculeId, year: 2019, field: 'resultat', value: 42 },
        { indicateurId: intactId, year: 2019, field: 'resultat', value: 7 },
      ],
    });

    await caller.demarches.pcaet.diagnostic.indicateurs.setReferenceYear({
      collectiviteId,
      demarcheId: demarche.id,
      indicateurIds: [basculeId],
      fromYear: 2019,
      toYear: 2021,
    });

    expect(
      await listResultats(caller, {
        collectiviteId,
        demarcheId: demarche.id,
        indicateurId: basculeId,
      })
    ).toEqual([{ year: 2021, resultat: 42 }]);
    expect(
      await listResultats(caller, {
        collectiviteId,
        demarcheId: demarche.id,
        indicateurId: intactId,
      })
    ).toEqual([{ year: 2019, resultat: 7 }]);
  });

  test("Un horizon d'objectif n'est pas une année de référence acceptable", async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const indicateurId = await getIndicateurId('cae_1.c');

    await expect(
      caller.demarches.pcaet.diagnostic.indicateurs.setReferenceYear({
        collectiviteId,
        demarcheId: demarche.id,
        indicateurIds: [indicateurId],
        fromYear: 2021,
        toYear: 2030,
      })
    ).rejects.toThrow();
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
      caller.demarches.pcaet.diagnostic.indicateurs.setReferenceYear({
        collectiviteId,
        demarcheId: demarche.id,
        indicateurIds: [1],
        fromYear: 2019,
        toYear: 2021,
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
      autre.caller.demarches.pcaet.diagnostic.indicateurs.setReferenceYear({
        collectiviteId: autre.collectiviteId,
        demarcheId: demarche.id,
        indicateurIds: [1],
        fromYear: 2019,
        toYear: 2021,
      })
    ).rejects.toThrow("démarche PCAET demandée n'a pas été trouvée");
  });
});
