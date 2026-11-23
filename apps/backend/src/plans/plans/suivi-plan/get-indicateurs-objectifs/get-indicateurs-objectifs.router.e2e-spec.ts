import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { createIndicateurPerso } from '@tet/backend/indicateurs/indicateurs/indicateur-perso.test-fixture';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';

describe('Suivi du plan : indicateurs et objectifs', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let admin: AuthenticatedUser;
  let visiteur: AuthenticatedUser;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = collectivite.id;
    admin = getAuthUserFromUserCredentials(user);

    const { user: visiteurUser } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    visiteur = getAuthUserFromUserCredentials(visiteurUser);

    return async () => {
      await app.close();
    };
  });

  const adminCaller = () => router.createCaller({ user: admin });

  const createPlan = async () => {
    const caller = adminCaller();
    const plan = await caller.plans.plans.create({
      nom: 'Plan suivi indicateurs',
      collectiviteId,
    });
    const axe = await caller.plans.axes.create({
      nom: 'Axe',
      collectiviteId,
      planId: plan.id,
      parent: plan.id,
    });
    return { planId: plan.id, axeId: axe.id };
  };

  const createFiche = async ({
    axeId,
    indicateurIds,
    restreint = false,
  }: {
    axeId: number;
    indicateurIds: number[];
    restreint?: boolean;
  }) => {
    const caller = adminCaller();
    const { id } = await caller.plans.fiches.create({
      fiche: { titre: 'Action', collectiviteId, restreint },
      ficheFields: { axes: [{ id: axeId }] },
    });
    await caller.plans.fiches.update({
      ficheId: id,
      ficheFields: { indicateurs: indicateurIds.map((i) => ({ id: i })) },
    });
    return id;
  };

  const createIndicateur = (
    titre: string,
    options: {
      estConfidentiel?: boolean;
      estFavori?: boolean;
      valeurs?: { dateValeur: string; resultat?: number; objectif?: number }[];
    } = {}
  ) =>
    createIndicateurPerso({
      caller: adminCaller(),
      indicateurData: { collectiviteId, titre, unite: 'tCO2e', ...options },
    });

  const getIndicateursObjectifs = (user: AuthenticatedUser, planId: number) =>
    router
      .createCaller({ user })
      .plans.suivi.getIndicateursObjectifs({ planId });

  it('liste les indicateurs des fiches et des axes, une carte par indicateur, avec ses résultats et ses objectifs, favoris en tête', async () => {
    const { planId, axeId } = await createPlan();
    const indicateurFiche = await createIndicateur('B - émissions', {
      valeurs: [
        { dateValeur: '2021-01-01', resultat: 120 },
        { dateValeur: '2023-01-01', resultat: 100 },
        { dateValeur: '2030-01-01', objectif: 60 },
        { dateValeur: '2050-01-01', objectif: 0 },
      ],
    });
    const indicateurAxe = await createIndicateur('A - consommation');
    const indicateurFavori = await createIndicateur('Z - favori', {
      estFavori: true,
    });
    await createFiche({ axeId, indicateurIds: [indicateurFiche] });
    await createFiche({
      axeId,
      indicateurIds: [indicateurFiche, indicateurFavori],
    });
    await db.db
      .insert(axeIndicateurTable)
      .values({ axeId, indicateurId: indicateurAxe, createdBy: admin.id });

    const indicateurs = await getIndicateursObjectifs(admin, planId);

    const definition = {
      identifiantReferentiel: null,
      unite: 'tCO2e',
      precision: expect.any(Number),
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    };
    expect(indicateurs).toEqual([
      {
        ...definition,
        id: indicateurFavori,
        titre: 'Z - favori',
        favori: true,
        resultats: null,
        objectifs: [],
      },
      {
        ...definition,
        id: indicateurAxe,
        titre: 'A - consommation',
        favori: false,
        resultats: null,
        objectifs: [],
      },
      {
        ...definition,
        id: indicateurFiche,
        titre: 'B - émissions',
        favori: false,
        resultats: {
          source: { type: 'collectivite' },
          points: [
            { dateValeur: '2021-01-01', valeur: 120 },
            { dateValeur: '2023-01-01', valeur: 100 },
          ],
        },
        objectifs: [
          { annee: 2030, valeur: 60 },
          { annee: 2050, valeur: 0 },
        ],
      },
    ]);
  });

  it('ignore les indicateurs des seules fiches supprimées ou restreintes invisibles', async () => {
    const { planId, axeId } = await createPlan();
    const indicateurSupprime = await createIndicateur('Fiche supprimée');
    const indicateurRestreint = await createIndicateur('Fiche restreinte');
    const ficheSupprimee = await createFiche({
      axeId,
      indicateurIds: [indicateurSupprime],
    });
    await adminCaller().plans.fiches.delete({ ficheId: ficheSupprimee });
    await createFiche({
      axeId,
      indicateurIds: [indicateurRestreint],
      restreint: true,
    });

    expect(
      (await getIndicateursObjectifs(admin, planId)).map((i) => i.id)
    ).toEqual([indicateurRestreint]);
    expect(await getIndicateursObjectifs(visiteur, planId)).toEqual([]);
  });

  it('masque le dernier résultat d’un indicateur confidentiel à qui ne peut pas le lire', async () => {
    const { planId, axeId } = await createPlan();
    const indicateurId = await createIndicateur('Confidentiel', {
      estConfidentiel: true,
      valeurs: [
        { dateValeur: '2022-01-01', resultat: 10 },
        { dateValeur: '2023-01-01', resultat: 12 },
      ],
    });
    await createFiche({ axeId, indicateurIds: [indicateurId] });

    const [pourAdmin] = await getIndicateursObjectifs(admin, planId);
    const [pourVisiteur] = await getIndicateursObjectifs(visiteur, planId);

    expect(pourAdmin.resultats?.points.at(-1)?.valeur).toBe(12);
    expect(pourVisiteur.resultats?.points).toEqual([
      { dateValeur: '2022-01-01', valeur: 10 },
    ]);
  });

  it('se replie sur l’open data sans résultat de la collectivité', async () => {
    const { planId, axeId } = await createPlan();
    const indicateurId = await createIndicateur('Open data');
    await createFiche({ axeId, indicateurIds: [indicateurId] });

    const sourceId = `test-suivi-${indicateurId}`;
    await db.db
      .insert(indicateurSourceTable)
      .values({ id: sourceId, libelle: 'Source test', ordreAffichage: 1 });
    const [metadonnee] = await db.db
      .insert(indicateurSourceMetadonneeTable)
      .values({ sourceId, dateVersion: '2024-01-01T00:00:00' })
      .returning();
    await db.db.insert(indicateurValeurTable).values({
      indicateurId,
      collectiviteId,
      metadonneeId: metadonnee.id,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateValeur: '2022-01-01',
      resultat: 42,
    });
    onTestFinished(async () => {
      await db.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.metadonneeId, metadonnee.id));
      await db.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadonnee.id));
      await db.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, sourceId));
    });

    const [indicateur] = await getIndicateursObjectifs(admin, planId);

    expect(indicateur.resultats).toEqual({
      source: { type: 'open-data', libelle: 'Source test' },
      points: [{ dateValeur: '2022-01-01', valeur: 42 }],
    });
  });

  it('refuse le bloc à qui ne peut pas lire le plan', async () => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { accesRestreint: true },
    });
    const planRestreint = await router
      .createCaller({ user: getAuthUserFromUserCredentials(user) })
      .plans.plans.create({
        nom: 'Plan privé',
        collectiviteId: collectivite.id,
      });
    const { collectivite: autreCollectivite } = await addTestCollectivite(db);
    const { user: autreUser } = await addTestUser(db, {
      collectiviteId: autreCollectivite.id,
      role: CollectiviteRole.ADMIN,
    });

    await expect(
      getIndicateursObjectifs(
        getAuthUserFromUserCredentials(autreUser),
        planRestreint.id
      )
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
