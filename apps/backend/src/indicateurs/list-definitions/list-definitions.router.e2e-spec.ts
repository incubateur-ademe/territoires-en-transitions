import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { getTestApp } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { DatabaseService } from '../../utils';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { indicateurDefinitionDetailleeSchema } from '../list-definitions/list-definitions.response';
import { indicateurDefinitionTable } from '../shared/models/indicateur-definition.table';

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
      //indicateurIds: [177],
    };
    const result = await caller.indicateurs.definitions.list(input);
    expect(result.length).toBe(1);
    const toCheck1 = indicateurDefinitionDetailleeSchema.safeParse(result[0]);
    expect(toCheck1.success).toBeTruthy;
    expect(result[0]?.enfants?.length).toBeGreaterThan(2);
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
});
