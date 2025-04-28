import {
  deleteIndicateurValeursForCollectivite,
  getCollectiviteIdBySiren,
  getIndicateurIdByIdentifiant,
} from '@/backend/test';
import { INestApplication } from '@nestjs/common';
import { inferProcedureInput } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { getTestApp } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { DatabaseService } from '../../utils';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { IndicateurValeur, indicateurValeurTable } from '../index-domain';
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
  let paysDuLaonCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();
    databaseService = app.get<DatabaseService>(DatabaseService);
    paysDuLaonCollectiviteId = await getCollectiviteIdBySiren(
      databaseService,
      '200043495'
    );
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
      resultat: 42.0001,
      resultatCommentaire: 'commentaire',
    };
    const result = await caller.indicateurs.valeurs.upsert(input);
    expect(result).not.toBe(null);
    expect(result?.resultat).toBe(42);

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
      resultat: 42.0001,
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
      resultat: 43.001,
    };
    const result = await caller.indicateurs.valeurs.upsert(inputUpdate);
    expect(result).not.toBe(null);
    expect(result?.resultat).toBe(43);

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

  test("Valeurs calculées lors de l'insertion d'une valeur", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const cae1eIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.e'
    );
    const cae1fIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.f'
    );
    const indicateurCalculeId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.k'
    );

    await deleteIndicateurValeursForCollectivite(
      databaseService,
      paysDuLaonCollectiviteId,
      [indicateurCalculeId, cae1fIndicateurId, cae1eIndicateurId]
    );

    // vérifie le nombre de valeurs avant insertion
    const inputBefore: InputList = {
      collectiviteId: paysDuLaonCollectiviteId,
      indicateurIds: [indicateurCalculeId],
    };

    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    expect(resultBefore.indicateurs.length).toBe(0);

    // insère une valeur
    const inputCae1e: InputUpsert = {
      collectiviteId: paysDuLaonCollectiviteId,
      indicateurId: cae1eIndicateurId,
      dateValeur: '2015-01-01',
      resultat: 102.04,
    };
    const resultCae1e = await caller.indicateurs.valeurs.upsert(inputCae1e);
    expect(resultCae1e).not.toBe(null);
    expect(resultCae1e?.resultat).toBe(102.04);

    // vérifie le nombre de valeurs après insertion
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    expect(resultAfter.indicateurs[0].sources.collectivite.valeurs.length).toBe(
      1
    );
    const indicateurCalculeValeur = resultAfter.indicateurs[0].sources
      .collectivite.valeurs[0] as IndicateurValeur;
    expect(indicateurCalculeValeur.resultat).toBe(102.04);
    expect(indicateurCalculeValeur.calculAuto).toBe(true);
    expect(
      indicateurCalculeValeur.calculAutoIdentifiantsManquants
    ).toStrictEqual(['cae_1.f']);
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

  test('Ne permet pas de recalculer si on utilise pas un compte de service', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(caller.indicateurs.valeurs.recompute({})).rejects.toThrow();
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

  test('Donne la moyenne des valeurs pour un indicateur', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.indicateurs.valeurs.average({
      collectiviteId: 3895,
      indicateurId: 73,
    });
    expect(result).toStrictEqual({
      typeCollectivite: 'CA',
      valeurs: [
        {
          dateValeur: '2014-01-01',
          valeur: 7.39,
          sourceLibelle: 'RARE-OREC',
        },
        {
          dateValeur: '2016-01-01',
          valeur: 7.47,
          sourceLibelle: 'RARE-OREC',
        },
        {
          dateValeur: '2017-01-01',
          valeur: 7.48,
          sourceLibelle: 'RARE-OREC',
        },
      ],
    });
  });
});
