import { INestApplication } from '@nestjs/common';
import {
  attachTestPlanToDemarchePcaet,
  createDemarche,
  ensureTestPcaetMetadonneeId,
} from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
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
import {
  DemarchePcaetStatus,
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
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

  it('liste les indicateurs des fiches et des axes, une carte par indicateur, avec ses résultats et ses objectifs, par ordre alphabétique', async () => {
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
      sources: ['plan'],
      departDepot: null,
    };
    // sans ordre choisi : alphabétique, le favori n'est plus remonté en tête
    expect(indicateurs).toEqual([
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
      {
        ...definition,
        id: indicateurFavori,
        titre: 'Z - favori',
        favori: true,
        resultats: null,
        objectifs: [],
      },
    ]);
  });

  it('restreint les indicateurs liés à un axe aux axes choisis', async () => {
    const { planId, axeId } = await createPlan();
    const autreAxe = await adminCaller().plans.axes.create({
      nom: 'Autre axe',
      collectiviteId,
      planId,
      parent: planId,
    });
    const indicateurAxe = await createIndicateur('A - sur l’axe');
    const indicateurAutreAxe = await createIndicateur('B - sur un autre axe');
    await db.db.insert(axeIndicateurTable).values([
      { axeId, indicateurId: indicateurAxe, createdBy: admin.id },
      {
        axeId: autreAxe.id,
        indicateurId: indicateurAutreAxe,
        createdBy: admin.id,
      },
    ]);

    const filtres = (axeIds: number[]) =>
      router
        .createCaller({ user: admin })
        .plans.suivi.getIndicateursObjectifs({ planId, axeIds })
        .then((indicateurs) => indicateurs.map(({ id }) => id));

    expect(await filtres([axeId])).toEqual([indicateurAxe]);
    expect(await filtres([])).toEqual(
      expect.arrayContaining([indicateurAxe, indicateurAutreAxe])
    );

    // un axe d'un autre plan ne donne pas accès à ses indicateurs
    const autrePlan = await createPlan();
    const indicateurAutrePlan = await createIndicateur('C - autre plan');
    await db.db.insert(axeIndicateurTable).values({
      axeId: autrePlan.axeId,
      indicateurId: indicateurAutrePlan,
      createdBy: admin.id,
    });
    expect(await filtres([autrePlan.axeId])).toEqual([]);
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

  describe('avec un dépôt PCAET rattaché au plan', () => {
    const getIndicateurIds = async (identifiants: string[]) => {
      const rows = await db.db
        .select({
          id: indicateurDefinitionTable.id,
          identifiant: indicateurDefinitionTable.identifiantReferentiel,
        })
        .from(indicateurDefinitionTable)
        .where(
          inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiants
          )
        );
      return Object.fromEntries(rows.map((r) => [r.identifiant, r.id]));
    };

    // Les totaux sont calculés à l'écriture par l'application : le test les
    // insère directement sous la métadonnée du dépôt.
    const insertValeursDepot = async ({
      collectiviteId,
      metadonneeId,
      valeurs,
    }: {
      collectiviteId: number;
      metadonneeId: number;
      valeurs: {
        indicateurId: number;
        dateValeur: string;
        resultat?: number;
        objectif?: number;
      }[];
    }) =>
      db.db.insert(indicateurValeurTable).values(
        valeurs.map((v) => ({
          ...v,
          collectiviteId,
          metadonneeId,
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        }))
      );

    const createPlanAvecDepot = async () => {
      const { collectiviteId, caller, demarche } = await createDemarche(
        db,
        router
      );
      const plan = await attachTestPlanToDemarchePcaet(db, {
        collectiviteId,
        demarcheId: demarche.id,
      });
      const metadonneeId = await ensureTestPcaetMetadonneeId(db, {
        collectiviteId,
        demarcheId: demarche.id,
      });
      const ids = await getIndicateurIds(['cae_1.a', 'cae_4.a', 'cae_2.a']);
      await insertValeursDepot({
        collectiviteId,
        metadonneeId,
        valeurs: [
          {
            indicateurId: ids['cae_1.a'],
            dateValeur: '2015-01-01',
            resultat: 160,
          },
          {
            indicateurId: ids['cae_1.a'],
            dateValeur: '2018-01-01',
            resultat: 152,
          },
          {
            indicateurId: ids['cae_1.a'],
            dateValeur: '2030-01-01',
            objectif: 90,
          },
          {
            indicateurId: ids['cae_4.a'],
            dateValeur: '2018-01-01',
            resultat: 10,
          },
          {
            indicateurId: ids['cae_4.a'],
            dateValeur: '2030-01-01',
            objectif: 6,
          },
          // un total sans objectif reste hors de la liste
          {
            indicateurId: ids['cae_2.a'],
            dateValeur: '2018-01-01',
            resultat: 500,
          },
        ],
      });
      const { user: lecteur } = await addTestUser(db, {
        collectiviteId,
        role: CollectiviteRole.LECTURE,
      });
      return {
        collectiviteId,
        caller,
        demarcheId: demarche.id,
        planId: plan.id,
        ids,
        lecteur: getAuthUserFromUserCredentials(lecteur),
      };
    };

    const summarize = (
      indicateurs: Awaited<ReturnType<typeof getIndicateursObjectifs>>
    ) =>
      indicateurs.map(({ id, sources, departDepot, objectifs }) => ({
        id,
        sources,
        departDepot,
        objectifs,
      }));

    it('ouvre la liste sur les réglementaires qui ont un objectif, lisibles sans droit sur le dépôt', async () => {
      const { planId, ids, lecteur } = await createPlanAvecDepot();

      expect(summarize(await getIndicateursObjectifs(lecteur, planId))).toEqual(
        expect.arrayContaining([
          {
            id: ids['cae_1.a'],
            sources: ['reglementaire'],
            departDepot: { annee: 2018, valeur: 152 },
            objectifs: [{ annee: 2030, valeur: 90 }],
          },
          {
            id: ids['cae_4.a'],
            sources: ['reglementaire'],
            departDepot: { annee: 2018, valeur: 10 },
            objectifs: [{ annee: 2030, valeur: 6 }],
          },
        ])
      );
      expect(
        (await getIndicateursObjectifs(lecteur, planId)).map(({ id }) => id)
      ).not.toContain(ids['cae_2.a']);
    });

    it('liste cae_3.b, hors dépôt, sans objectif, après les réglementaires du dépôt', async () => {
      const { planId, ids, lecteur } = await createPlanAvecDepot();
      const ratioId = (await getIndicateurIds(['cae_3.b']))['cae_3.b'];

      const indicateurs = await getIndicateursObjectifs(lecteur, planId);
      const ordre = indicateurs.map(({ id }) => id);

      expect(ordre.indexOf(ids['cae_1.a'])).toBeLessThan(
        ordre.indexOf(ids['cae_4.a'])
      );
      expect(ordre.indexOf(ids['cae_4.a'])).toBeLessThan(
        ordre.indexOf(ratioId)
      );
      expect(summarize(indicateurs).find(({ id }) => id === ratioId)).toEqual({
        id: ratioId,
        sources: ['reglementaire'],
        departDepot: null,
        objectifs: [],
      });
    });

    it('fusionne un réglementaire lié au plan en une seule carte, objectifs du dépôt en priorité', async () => {
      const { collectiviteId, caller, planId, ids, lecteur } =
        await createPlanAvecDepot();
      const { id: ficheId } = await caller.plans.fiches.create({
        fiche: { titre: 'Action GES', collectiviteId },
        ficheFields: { axes: [{ id: planId }] },
      });
      await caller.plans.fiches.update({
        ficheId,
        ficheFields: { indicateurs: [{ id: ids['cae_1.a'] }] },
      });
      await db.db.insert(indicateurValeurTable).values({
        indicateurId: ids['cae_1.a'],
        collectiviteId,
        dateValeur: '2030-01-01',
        objectif: 100,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      });

      const indicateurs = await getIndicateursObjectifs(lecteur, planId);
      expect(indicateurs.filter(({ id }) => id === ids['cae_1.a'])).toEqual([
        expect.objectContaining({
          sources: ['reglementaire', 'plan'],
          objectifs: [{ annee: 2030, valeur: 90 }],
        }),
      ]);
    });

    it('ne montre le dépôt à un visiteur qu’une fois publié', async () => {
      const { demarcheId, planId, ids } = await createPlanAvecDepot();

      expect(await getIndicateursObjectifs(visiteur, planId)).toEqual([]);

      await db.db
        .update(demarcheTable)
        .set({
          status: DemarchePcaetStatusEnum.PUBLIE,
          publishedAt: new Date().toISOString(),
        })
        .where(eq(demarcheTable.id, demarcheId));

      expect(
        (await getIndicateursObjectifs(visiteur, planId)).map(({ id }) => id)
      ).toEqual(expect.arrayContaining([ids['cae_1.a'], ids['cae_4.a']]));
    });

    it('lit la démarche en cours plutôt qu’un dépôt précédent publié', async () => {
      const { collectiviteId, demarcheId, planId, ids, lecteur } =
        await createPlanAvecDepot();
      // Le plan était rattaché au dépôt précédent avant l'ouverture du
      // nouveau : la démarche en cours est mise de côté le temps de recréer
      // ce rattachement, que le trigger d'exclusivité refuserait sinon.
      const setStatus = (status: DemarchePcaetStatus) =>
        db.db
          .update(demarcheTable)
          .set({ status })
          .where(eq(demarcheTable.id, demarcheId));
      await setStatus(DemarchePcaetStatusEnum.PUBLIE);
      const [precedent] = await db.db
        .insert(demarcheTable)
        .values({
          collectiviteId,
          type: DemarcheTypeEnum.PCAET,
          titre: 'PCAET précédent',
          status: DemarchePcaetStatusEnum.PUBLIE,
          publishedAt: '2020-06-01T00:00:00Z',
        })
        .returning({ id: demarcheTable.id });
      await db.db
        .insert(demarchePlanActionTable)
        .values({ demarcheId: precedent.id, planActionId: planId });
      await setStatus(DemarchePcaetStatusEnum.EN_ELABORATION);
      const metadonneePrecedent = await ensureTestPcaetMetadonneeId(db, {
        collectiviteId,
        demarcheId: precedent.id,
      });
      await insertValeursDepot({
        collectiviteId,
        metadonneeId: metadonneePrecedent,
        valeurs: [
          {
            indicateurId: ids['cae_1.a'],
            dateValeur: '2012-01-01',
            resultat: 170,
          },
          {
            indicateurId: ids['cae_1.a'],
            dateValeur: '2030-01-01',
            objectif: 120,
          },
        ],
      });

      const ges = (await getIndicateursObjectifs(lecteur, planId)).find(
        ({ id }) => id === ids['cae_1.a']
      );
      expect(ges?.objectifs).toEqual([{ annee: 2030, valeur: 90 }]);
      expect(ges?.departDepot).toEqual({ annee: 2018, valeur: 152 });
    });

    it('ne retombe pas sur le dépôt publié quand la démarche en cours n’a pas encore de métadonnée', async () => {
      const { collectiviteId, demarche } = await createDemarche(db, router);
      const plan = await attachTestPlanToDemarchePcaet(db, {
        collectiviteId,
        demarcheId: demarche.id,
      });
      const { user: lecteurUser } = await addTestUser(db, {
        collectiviteId,
        role: CollectiviteRole.LECTURE,
      });
      const lecteur = getAuthUserFromUserCredentials(lecteurUser);
      const ids = await getIndicateurIds(['cae_1.a']);

      // même séquence que le test précédent : le plan passe d'abord par un
      // dépôt publié, puis la démarche en cours reprend le rattachement
      const setStatus = (demarcheId: number, status: DemarchePcaetStatus) =>
        db.db
          .update(demarcheTable)
          .set({ status })
          .where(eq(demarcheTable.id, demarcheId));
      await setStatus(demarche.id, DemarchePcaetStatusEnum.PUBLIE);
      const [precedent] = await db.db
        .insert(demarcheTable)
        .values({
          collectiviteId,
          type: DemarcheTypeEnum.PCAET,
          titre: 'PCAET précédent',
          status: DemarchePcaetStatusEnum.PUBLIE,
          publishedAt: '2020-06-01T00:00:00Z',
        })
        .returning({ id: demarcheTable.id });
      await db.db
        .insert(demarchePlanActionTable)
        .values({ demarcheId: precedent.id, planActionId: plan.id });
      await setStatus(demarche.id, DemarchePcaetStatusEnum.EN_ELABORATION);
      const metadonneePrecedent = await ensureTestPcaetMetadonneeId(db, {
        collectiviteId,
        demarcheId: precedent.id,
      });
      await insertValeursDepot({
        collectiviteId,
        metadonneeId: metadonneePrecedent,
        valeurs: [
          {
            indicateurId: ids['cae_1.a'],
            dateValeur: '2012-01-01',
            resultat: 170,
          },
          {
            indicateurId: ids['cae_1.a'],
            dateValeur: '2030-01-01',
            objectif: 120,
          },
        ],
      });

      // la démarche en cours n'a aucune métadonnée : le dépôt publié ne doit
      // pas la remplacer dans la lecture
      const ges = (await getIndicateursObjectifs(lecteur, plan.id)).find(
        ({ id }) => id === ids['cae_1.a']
      );
      expect(ges?.departDepot ?? null).toBeNull();
      expect(ges?.objectifs ?? []).toEqual([]);
    });
  });
});
