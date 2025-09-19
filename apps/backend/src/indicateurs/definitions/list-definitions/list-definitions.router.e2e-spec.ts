import { getAuthUser, getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { DatabaseService } from '../../../utils';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { indicateurDefinitionTable } from '../indicateur-definition.table';
import { indicateurDefinitionDetailleeSchema } from './list-definitions.response';

type Input = inferProcedureInput<
  AppRouter['indicateurs']['definitions']['list']
>;

describe("Route de lecture des définitions d'indicateurs", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();
    databaseService = app.get<DatabaseService>(DatabaseService);
  });

  test(`Test que la requête s'exécute`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      identifiantsReferentiel: ['cae_1.a'],
    };
    const result = await caller.indicateurs.definitions.list(input);
    expect(result.length).toBe(1);

    const toCheck1 = indicateurDefinitionDetailleeSchema.safeParse(result[0]);
    console.log(toCheck1.error);
    expect(toCheck1.success).toBeTruthy();

    const [indicateur] = result;

    expect(indicateur.enfants?.length).toBeGreaterThan(2);

    expect(Array.isArray(indicateur.thematiques)).toBeTruthy();
    expect(Array.isArray(indicateur.pilotes)).toBeTruthy();
    expect(Array.isArray(indicateur.services)).toBeTruthy();
  });

  test("Fourni le chemin d'un indicateur", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const rows = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.ca'));

    const result = await caller.indicateurs.definitions.getPath({
      collectiviteId: 1,
      indicateurId: rows[0].id,
    });
    expect(result).toMatchObject([
      {
        id: expect.any(Number),
        titre: 'Émissions de gaz à effet de serre',
        identifiant: 'cae_1.a',
      },
      { id: expect.any(Number), titre: 'Résidentiel', identifiant: 'cae_1.c' },
      {
        id: expect.any(Number),
        titre: 'Chauffage / Maisons individuelles',
        identifiant: 'cae_1.ca',
      },
    ]);
  });

  test("Ne permet pas d'ajouter un indicateur perso. si on n'a pas le droit édition sur la collectivité", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    await expect(() =>
      caller.indicateurs.definitions.create({
        collectiviteId: 100,
        titre: 'mon indicateur',
      })
    ).rejects.toThrowError(/Droits insuffisants/);
  });

  test("Permet d'ajouter un indicateur perso", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const indicateurId = await caller.indicateurs.definitions.create({
      collectiviteId: 1,
      titre: 'mon indicateur',
      thematiques: [1],
      commentaire: 'mon commentaire',
      estFavori: true,
      unite: 'km',
    });
    expect(indicateurId).toBeTypeOf('number');
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.collectiviteId, 1),
            eq(indicateurDefinitionTable.id, indicateurId)
          )
        );
    });
  });
});
