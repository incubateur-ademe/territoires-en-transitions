import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { historiqueFicheActionTable } from '@tet/backend/plans/fiches/shared/models/historique-fiche-action.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { Statut, StatutEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { format } from 'date-fns';
import { eq, sql } from 'drizzle-orm';
import { Workbook } from 'exceljs';
import { default as request } from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const AUJOURDHUI = format(new Date(), 'yyyy-MM-dd');
const AUJOURDHUI_FR = format(new Date(), 'dd/MM/yyyy');

describe('Suivi du plan : exports Excel', () => {
  let app: INestApplication;
  let token: string;
  let planId: number;
  let thematique: { id: number; nom: string };

  beforeAll(async () => {
    app = await getTestApp();
    const router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const collectiviteId = collectivite.id;
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    token = await getAuthToken({
      email: user.email ?? '',
      password: user.password,
    });

    [thematique] = await caller.shared.thematiques.list();

    const plan = await caller.plans.plans.create({
      nom: 'Plan export',
      collectiviteId,
    });
    planId = plan.id;
    const createAxe = async (nom: string, parent: number) =>
      (await caller.plans.axes.create({ nom, collectiviteId, planId, parent }))
        .id;
    const axeA = await createAxe('Axe A', planId);
    const sousAxeA1 = await createAxe('Sous-axe A1', axeA);
    const axeB = await createAxe('Axe B', planId);

    const createFiche = async ({
      axe,
      statuts,
      jauge,
      thematiques = [],
      ameliorationContinue = false,
      createdAt = '2024-01-01T10:00:00Z',
    }: {
      axe: number;
      statuts: Statut[];
      jauge?: number;
      thematiques?: number[];
      ameliorationContinue?: boolean;
      createdAt?: string;
    }) => {
      const { id } = await caller.plans.fiches.create({
        fiche: { titre: 'Action', collectiviteId },
        ficheFields: {
          axes: [{ id: axe }],
          thematiques: thematiques.map((thematiqueId) => ({
            id: thematiqueId,
          })),
        },
      });
      for (const statut of statuts) {
        await caller.plans.fiches.update({
          ficheId: id,
          ficheFields: { statut },
        });
      }
      if (jauge !== undefined) {
        await caller.plans.fiches.update({
          ficheId: id,
          ficheFields: { jauge },
        });
      }
      await db.db
        .update(ficheActionTable)
        .set({ createdAt, ameliorationContinue })
        .where(eq(ficheActionTable.id, id));
      await db.db.execute(
        sql`delete from historique.fiche_action_pilote where fiche_historise_id in (select id from historique.fiche_action where fiche_id = ${id})`
      );
      await db.db
        .delete(historiqueFicheActionTable)
        .where(eq(historiqueFicheActionTable.ficheId, id));
      return id;
    };

    await createFiche({
      axe: sousAxeA1,
      statuts: [StatutEnum.REALISE],
      thematiques: [thematique.id],
    });
    const ficheEnCours = await createFiche({
      axe: axeA,
      statuts: [StatutEnum.EN_COURS],
      jauge: 50,
    });
    await db.db.insert(historiqueFicheActionTable).values({
      ficheId: ficheEnCours,
      collectiviteId,
      createdAt: '2024-01-01T10:00:00Z',
      modifiedAt: '2025-01-01T10:00:00Z',
      statut: StatutEnum.EN_COURS,
      previousStatut: StatutEnum.A_VENIR,
    });
    await createFiche({
      axe: axeB,
      statuts: [StatutEnum.EN_COURS],
      ameliorationContinue: true,
    });
    await createFiche({
      axe: axeB,
      statuts: [StatutEnum.REALISE, StatutEnum.ABANDONNE],
    });
    await createFiche({
      axe: axeB,
      statuts: [StatutEnum.A_VENIR],
      createdAt: '2025-03-01T10:00:00Z',
    });

    return async () => {
      await app.close();
    };
  });

  const exportBloc = (bloc: string, body: object) =>
    request(app.getHttpServer())
      .post(`/plan/suivi/${bloc}/export`)
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

  const getFilename = (response: request.Response) =>
    decodeURI(
      response.headers['content-disposition'].split('filename="')[1]
    ).replace(/"$/, '');

  it('exporte la vue d’ensemble', async () => {
    const response = await exportBloc('vue-ensemble', { planId }).expect(201);

    expect(getFilename(response)).toBe(
      `Suivi_Plan export_Vue d'ensemble_${AUJOURDHUI}.xlsx`
    );
    expect(await readRows(response.body)).toEqual([
      ["Vue d'ensemble"],
      ['Plan', 'Plan export'],
      ['Thématiques', 'Toutes'],
      ['Exporté le', AUJOURDHUI_FR],
      [],
      ['Avancement du plan', 0.38],
      ['Nombre de fiches', 5],
      ['Dont abandonnées', 1],
      ['En cours sans avancement renseigné', 1],
      [],
      ['Statut', 'Nombre de fiches'],
      ['À venir', 1],
      ['En cours', 2],
      ['Réalisé', 1],
      ['En pause', 0],
      ['Abandonné', 1],
      ['Bloqué', 0],
      ['En retard', 0],
      ['A discuter', 0],
      ['Sans statut', 0],
    ]);
  });

  it('exporte la vue d’ensemble filtrée par thématique', async () => {
    const response = await exportBloc('vue-ensemble', {
      planId,
      thematiqueIds: [thematique.id],
    }).expect(201);

    const rows = await readRows(response.body);
    expect(rows.slice(2, 9)).toEqual([
      ['Thématiques', thematique.nom],
      ['Exporté le', AUJOURDHUI_FR],
      [],
      ['Avancement du plan', 1],
      ['Nombre de fiches', 1],
      ['Dont abandonnées', 0],
      ['En cours sans avancement renseigné', 0],
    ]);
  });

  it('exporte l’avancement par axe', async () => {
    const response = await exportBloc('avancement-par-axe', { planId }).expect(
      201
    );

    expect(getFilename(response)).toBe(
      `Suivi_Plan export_Avancement par axe_${AUJOURDHUI}.xlsx`
    );
    expect((await readRows(response.body)).slice(4)).toEqual([
      [],
      ['Axe', 'Avancement', 'Nombre de fiches', 'Fiches réalisées'],
      ['Axe A', 0.75, 2, 1],
      ['Sous-axe A1', 1, 1, 1],
      ['Axe B', 0, 3, 0],
    ]);
  });

  it('exporte l’évolution des statuts sans les actions continues', async () => {
    const response = await exportBloc('evolution-statuts', {
      planId,
      dateDebut: '2024-06-01',
      dateFin: AUJOURDHUI,
    }).expect(201);

    expect(getFilename(response)).toBe(
      `Suivi_Plan export_Evolution des statuts_${AUJOURDHUI}.xlsx`
    );
    expect((await readRows(response.body)).slice(4)).toEqual([
      ['Période', `Du 01/06/2024 au ${AUJOURDHUI_FR}`],
      ['Actions continues', 'Retirées (1)'],
      [],
      ['Statut', 'Au 01/06/2024', `Au ${AUJOURDHUI_FR}`, 'Évolution'],
      ['À venir', 1, 1, 0],
      ['En cours', 0, 1, 1],
      ['Réalisé', 1, 1, 0],
      ['En pause', 0, 0, 0],
      ['Abandonné', 1, 1, 0],
      ['Bloqué', 0, 0, 0],
      ['En retard', 0, 0, 0],
      ['A discuter', 0, 0, 0],
      ['Total', 3, 4, 1],
      [],
      ['Fiches créées depuis le 01/06/2024', 1],
    ]);
  });

  it('exporte l’évolution des statuts avec les actions continues et la date ramenée', async () => {
    const response = await exportBloc('evolution-statuts', {
      planId,
      dateDebut: '2023-01-01',
      dateFin: AUJOURDHUI,
      inclureActionsContinues: true,
    }).expect(201);

    const rows = await readRows(response.body);
    expect(rows.slice(4, 8)).toEqual([
      ['Période', `Du 11/12/2023 au ${AUJOURDHUI_FR}`],
      ['Actions continues', 'Incluses (1)'],
      [
        'Historique',
        'Les statuts ne sont historisés que depuis le 11/12/2023 : la date de début y est ramenée.',
      ],
      [],
    ]);
    expect(rows.find((row) => row[0] === 'Total')).toEqual(['Total', 0, 5, 5]);
  });

  it('applique les filtres du Pilotage et les liste dans l’en-tête', async () => {
    const response = await exportBloc('vue-ensemble', {
      planId,
      filters: { enCoursSansAvancement: true },
    }).expect(201);

    expect((await readRows(response.body)).slice(2, 10)).toEqual([
      ['Thématiques', 'Toutes'],
      ['Suivi', 'En cours à jauge 0 %'],
      ['Exporté le', AUJOURDHUI_FR],
      [],
      ['Avancement du plan', 0],
      ['Nombre de fiches', 1],
      ['Dont abandonnées', 0],
      ['En cours sans avancement renseigné', 1],
    ]);
  });

  it('filtre l’avancement par axe par statut', async () => {
    const response = await exportBloc('avancement-par-axe', {
      planId,
      filters: { statuts: [StatutEnum.REALISE] },
    }).expect(201);

    expect((await readRows(response.body)).slice(3)).toEqual([
      ['Statut', 'Réalisé'],
      ['Exporté le', AUJOURDHUI_FR],
      [],
      ['Axe', 'Avancement', 'Nombre de fiches', 'Fiches réalisées'],
      ['Axe A', 1, 1, 1],
      ['Sous-axe A1', 1, 1, 1],
      ['Axe B', 0, 0, 0],
    ]);
  });

  it('refuse une période inversée', async () => {
    await exportBloc('evolution-statuts', {
      planId,
      dateDebut: AUJOURDHUI,
      dateFin: '2024-06-01',
    }).expect(400);
  });

  it('refuse l’export sans authentification', async () => {
    await request(app.getHttpServer())
      .post('/plan/suivi/vue-ensemble/export')
      .send({ planId })
      .expect(401);
  });
});
