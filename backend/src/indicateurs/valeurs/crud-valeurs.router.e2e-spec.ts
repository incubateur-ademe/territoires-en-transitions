import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { getTestApp } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { DatabaseService } from '../../utils';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { indicateurValeurTable } from '../index-domain';
import { getIndicateursValeursResponseSchema } from '../shared/models/get-indicateurs.response';

type InputList = inferProcedureInput<
  AppRouter['indicateurs']['valeurs']['list']
>;

type InputUpsert = inferProcedureInput<
  AppRouter['indicateurs']['valeurs']['upsert']
>;

const collectiviteId = 1;
const indicateurId = 1;

describe("Route de lecture/écriture des valeurs d'indicateurs", () => {
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

  beforeEach(async () => {
    // reset les données avant de commencer les tests
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.indicateurId, indicateurId)
        )
      );
  });

  test(`Renvoi des valeurs`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: InputList = {
      collectiviteId,
      identifiantsReferentiel: 'cae_8',
    };
    const result = await caller.indicateurs.valeurs.list(input);
    expect(result.indicateurs.length).not.toBe(0);
    expect(result.indicateurs[0].sources.collectivite.valeurs.length).not.toBe(
      0
    );
    const toCheck = getIndicateursValeursResponseSchema.safeParse(result);
    expect(toCheck.success).toBeTruthy;
  });

  test("Permet d'insérer une valeur", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // vérifie le nombre de valeurs avant insertion
    const inputBefore: InputList = {
      collectiviteId,
      indicateurIds: [indicateurId],
    };
    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    expect(resultBefore.indicateurs.length).toBe(0);

    // insère une valeur
    const input: InputUpsert = {
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 42,
      resultatCommentaire: 'commentaire',
    };
    const result = await caller.indicateurs.valeurs.upsert(input);
    expect(result).not.toBe(null);

    // vérifie le nombre de valeurs après insertion
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    expect(resultAfter.indicateurs[0].sources.collectivite.valeurs.length).toBe(
      1
    );
  });

  test('Permet de mettre à jour une valeur', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // insère une valeur
    const inputInsert: InputUpsert = {
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 42,
      resultatCommentaire: 'commentaire',
    };
    await caller.indicateurs.valeurs.upsert(inputInsert);

    // vérifie le nombre de valeurs avant mise à jour
    const inputBefore: InputList = {
      collectiviteId,
      indicateurIds: [indicateurId],
    };
    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    expect(
      resultBefore.indicateurs[0].sources.collectivite.valeurs.length
    ).toBe(1);

    // met à jour que la valeur
    const inputUpdate: InputUpsert = {
      collectiviteId,
      indicateurId,
      id: resultBefore.indicateurs[0].sources.collectivite.valeurs[0].id,
      resultat: 43,
    };
    const result = await caller.indicateurs.valeurs.upsert(inputUpdate);
    expect(result).not.toBe(null);

    // vérifie le nombre de valeurs après mise à jour
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    expect(resultAfter.indicateurs[0].sources.collectivite.valeurs.length).toBe(
      1
    );
    expect(
      resultAfter.indicateurs[0].sources.collectivite.valeurs[0].resultat
    ).toBe(43);
    expect(
      resultAfter.indicateurs[0].sources.collectivite.valeurs[0]
        .resultatCommentaire
    ).toBe('commentaire');

    // met à jour la valeur objectif pour la même date
    const inputUpdateObjectif: InputUpsert = {
      collectiviteId,
      indicateurId,
      id: resultBefore.indicateurs[0].sources.collectivite.valeurs[0].id,
      objectif: 44,
    };
    const resultObjectif = await caller.indicateurs.valeurs.upsert(
      inputUpdateObjectif
    );
    expect(resultObjectif).not.toBe(null);

    // vérifie le nombre de valeurs après mise à jour
    const resultAfterObjectif = await caller.indicateurs.valeurs.list(
      inputBefore
    );
    expect(
      resultAfterObjectif.indicateurs[0].sources.collectivite.valeurs.length
    ).toBe(1);
    expect(
      resultAfterObjectif.indicateurs[0].sources.collectivite.valeurs[0]
        .resultat
    ).toBe(43);
    expect(
      resultAfterObjectif.indicateurs[0].sources.collectivite.valeurs[0]
        .objectif
    ).toBe(44);
  });

  test("Ne permet pas d'insérer une valeur si on n'a pas le droit requis", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: InputUpsert = {
      collectiviteId: 100,
      indicateurId: 1,
      dateValeur: '2021-01-01',
      resultat: 42,
    };
    await expect(caller.indicateurs.valeurs.upsert(input)).rejects.toThrow();
  });

  test('Permet de supprimer une valeur', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    // insère une valeur
    const inputInsert: InputUpsert = {
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 42,
      resultatCommentaire: 'commentaire',
    };
    await caller.indicateurs.valeurs.upsert(inputInsert);

    // vérifie le nombre de valeurs avant la suppression
    const inputBefore: InputList = {
      collectiviteId,
      indicateurIds: [indicateurId],
    };
    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    expect(
      resultBefore.indicateurs[0].sources.collectivite.valeurs.length
    ).toBe(1);

    // supprime l'entrée
    const valeurId =
      resultBefore.indicateurs[0].sources.collectivite.valeurs[0].id;
    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId,
      id: valeurId,
    });

    // vérifie le nombre de valeurs après la suppression
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    expect(resultAfter.indicateurs.length).toBe(0);
  });
});
