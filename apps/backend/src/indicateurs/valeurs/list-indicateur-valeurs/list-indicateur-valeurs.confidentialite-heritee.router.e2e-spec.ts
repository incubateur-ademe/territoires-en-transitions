import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { COLLECTIVITE_SOURCE_ID } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { describe, expect, onTestFinished, test } from 'vitest';

type Caller = ReturnType<TrpcRouter['createCaller']>;

describe("Confidentialité d'un indicateur transmise à ses sous-indicateurs", () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let memberUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);
    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    memberUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const createVisitorCaller = async (): Promise<Caller> => {
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(other.cleanup);
    return router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });
  };

  const createConfidentialParentWithSousIndicateur = async () => {
    const member = router.createCaller({ user: memberUser });
    const parentId = await member.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Déchets ménagers',
      unite: 't',
      estConfidentiel: false,
    });
    const sousIndicateurId = await member.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Ordures ménagères',
      parentId,
    });
    await member.indicateurs.indicateurs.update({
      collectiviteId: collectivite.id,
      indicateurId: parentId,
      indicateurFields: { estConfidentiel: true },
    });
    for (const [dateValeur, resultat] of [
      ['2022-01-01', 1],
      ['2023-01-01', 2],
    ] as const) {
      await member.indicateurs.valeurs.upsert({
        collectiviteId: collectivite.id,
        indicateurId: sousIndicateurId,
        dateValeur,
        resultat,
      });
    }
    return { member, sousIndicateurId };
  };

  const listResultats = async (caller: Caller, indicateurId: number) => {
    const { indicateurs } = await caller.indicateurs.valeurs.list({
      collectiviteId: collectivite.id,
      indicateurIds: [indicateurId],
      sources: [COLLECTIVITE_SOURCE_ID],
    });
    return (indicateurs[0]?.sources[COLLECTIVITE_SOURCE_ID]?.valeurs ?? [])
      .map(({ dateValeur, resultat }) => [dateValeur, resultat])
      .sort();
  };

  test('un visiteur ne voit pas le dernier résultat d’un sous-indicateur dont le parent est confidentiel', async () => {
    const { sousIndicateurId } =
      await createConfidentialParentWithSousIndicateur();
    const visitor = await createVisitorCaller();

    await expect(listResultats(visitor, sousIndicateurId)).resolves.toEqual([
      ['2022-01-01', 1],
      ['2023-01-01', null],
    ]);
  });

  test('un membre voit tous les résultats du sous-indicateur', async () => {
    const { member, sousIndicateurId } =
      await createConfidentialParentWithSousIndicateur();

    await expect(listResultats(member, sousIndicateurId)).resolves.toEqual([
      ['2022-01-01', 1],
      ['2023-01-01', 2],
    ]);
  });

  test('un visiteur voit tous les résultats quand ni le parent ni le sous-indicateur ne sont confidentiels', async () => {
    const member = router.createCaller({ user: memberUser });
    const parentId = await member.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Eau',
      unite: 'm3',
    });
    const sousIndicateurId = await member.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Eau potable',
      parentId,
    });
    await member.indicateurs.valeurs.upsert({
      collectiviteId: collectivite.id,
      indicateurId: sousIndicateurId,
      dateValeur: '2023-01-01',
      resultat: 5,
    });
    const visitor = await createVisitorCaller();

    await expect(listResultats(visitor, sousIndicateurId)).resolves.toEqual([
      ['2023-01-01', 5],
    ]);
  });
});
