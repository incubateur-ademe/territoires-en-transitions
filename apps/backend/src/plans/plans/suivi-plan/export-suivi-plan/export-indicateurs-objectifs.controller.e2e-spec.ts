import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createIndicateurPerso } from '@tet/backend/indicateurs/indicateurs/indicateur-perso.test-fixture';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { CollectiviteRole } from '@tet/domain/users';
import { format } from 'date-fns';
import { Workbook } from 'exceljs';
import { default as request } from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const AUJOURDHUI_FR = format(new Date(), 'dd/MM/yyyy');

describe('Suivi du plan : export Excel des indicateurs et objectifs', () => {
  let app: INestApplication;
  let token: string;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let db: Awaited<ReturnType<typeof getTestDatabase>>;
  let collectiviteId: number;
  let userId: string;
  let caller: ReturnType<
    Awaited<ReturnType<typeof getTestRouter>>['createCaller']
  >;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = collectivite.id;
    userId = user.id;
    caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    token = await getAuthToken({
      email: user.email ?? '',
      password: user.password,
    });

    return async () => {
      await app.close();
    };
  });

  // les indicateurs se créent dans le test : leur nettoyage exige un test en cours
  const creerPlanAvecIndicateurs = async () => {
    const plan = await caller.plans.plans.create({
      nom: 'Plan export indicateurs',
      collectiviteId,
    });
    const axe = await caller.plans.axes.create({
      nom: 'Axe',
      collectiviteId,
      planId: plan.id,
      parent: plan.id,
    });

    const indicateurEmissions = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'B - émissions',
        unite: 'tCO2e',
        valeurs: [
          { dateValeur: '2021-01-01', resultat: 120 },
          { dateValeur: '2023-01-01', resultat: 100 },
          { dateValeur: '2030-01-01', objectif: 60 },
        ],
      },
    });
    const indicateurConsommation = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId,
        titre: 'A - consommation',
        unite: 'MWh',
      },
    });
    await db.db.insert(axeIndicateurTable).values([
      { axeId: axe.id, indicateurId: indicateurEmissions, createdBy: userId },
      {
        axeId: axe.id,
        indicateurId: indicateurConsommation,
        createdBy: userId,
      },
    ]);
    return plan.id;
  };

  const exportIndicateurs = (body: object) =>
    request(app.getHttpServer())
      .post('/plan/suivi/indicateurs-objectifs/export')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .responseType('blob');

  const readRows = async (body: ArrayBuffer) => {
    const workbook = new Workbook();
    await workbook.xlsx.load(body);
    const rows: unknown[][] = [];
    workbook.getWorksheet(1)?.eachRow({ includeEmpty: true }, (row) => {
      rows.push((row.values as unknown[]).slice(1));
    });
    return rows;
  };

  it('exporte toute la liste avec les valeurs de départ, dernière et objectif de l’horizon', async () => {
    const planId = await creerPlanAvecIndicateurs();
    const response = await exportIndicateurs({
      planId,
      horizon: 2030,
    }).expect(201);

    expect(await readRows(response.body)).toEqual([
      ['Indicateurs et objectifs'],
      ['Plan', 'Plan export indicateurs'],
      ['Thématiques', 'Toutes'],
      ['Horizon', '2030'],
      ['Exporté le', AUJOURDHUI_FR],
      [],
      [
        'Indicateur',
        'Unité',
        'Source',
        'Valeur de départ',
        'Année de départ',
        'Dernière valeur',
        'Année de la dernière valeur',
        'Objectif',
        'Année de l’objectif',
        'Chemin parcouru',
      ],
      // sans valeur ni objectif, les cellules restent vides
      ['A - consommation', 'MWh', "Lié au plan d'action"],
      [
        'B - émissions',
        'tCO2e',
        "Lié au plan d'action",
        120,
        2021,
        100,
        2023,
        60,
        2030,
        expect.closeTo(1 / 3, 5),
      ],
    ]);
  });

  it('applique le filtre « Afficher » : réglementaires seuls, aucun ici', async () => {
    const planId = await creerPlanAvecIndicateurs();
    const response = await exportIndicateurs({
      planId,
      horizon: 2030,
      source: 'reglementaires',
    }).expect(201);

    const rows = await readRows(response.body);
    expect(rows.slice(2, 5)).toEqual([
      ['Thématiques', 'Toutes'],
      ['Afficher', 'Réglementaires'],
      ['Horizon', '2030'],
    ]);
    expect(rows).toHaveLength(8);
  });

  it('refuse un horizon hors de ceux du bloc', async () => {
    const planId = await creerPlanAvecIndicateurs();
    await exportIndicateurs({ planId, horizon: 2041 }).expect(400);
  });

  it('refuse l’export sans authentification', async () => {
    await request(app.getHttpServer())
      .post('/plan/suivi/indicateurs-objectifs/export')
      .send({ planId: 1 })
      .expect(401);
  });
});
