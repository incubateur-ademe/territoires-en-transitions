import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { historiqueFicheActionTable } from '@tet/backend/plans/fiches/shared/models/historique-fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Statut, StatutEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Suivi du plan : évolution des statuts', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let admin: AuthenticatedUser;
  let planId: number;
  let thematiqueId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const collectiviteId = collectivite.id;
    admin = getAuthUserFromUserCredentials(user);
    const caller = router.createCaller({ user: admin });

    const [thematique] = await caller.shared.thematiques.list();
    thematiqueId = thematique.id;

    const plan = await caller.plans.plans.create({
      nom: 'Plan suivi',
      collectiviteId,
    });
    planId = plan.id;

    const createFiche = async ({
      createdAt,
      statut,
      ameliorationContinue = false,
      thematiques = [],
      historique = [],
    }: {
      createdAt: string;
      statut: Statut;
      ameliorationContinue?: boolean;
      thematiques?: number[];
      historique?: {
        modifiedAt: string;
        statut: Statut;
        previousStatut: Statut;
      }[];
    }) => {
      const { id } = await caller.plans.fiches.create({
        fiche: { titre: 'Action', collectiviteId },
        ficheFields: {
          axes: [{ id: planId }],
          thematiques: thematiques.map((id) => ({ id })),
        },
      });
      await db.db
        .update(ficheActionTable)
        .set({ statut, ameliorationContinue, createdAt })
        .where(eq(ficheActionTable.id, id));
      await db.db.execute(
        sql`delete from historique.fiche_action_pilote where fiche_historise_id in (select id from historique.fiche_action where fiche_id = ${id})`
      );
      await db.db
        .delete(historiqueFicheActionTable)
        .where(inArray(historiqueFicheActionTable.ficheId, [id]));
      if (historique.length) {
        await db.db.insert(historiqueFicheActionTable).values(
          historique.map((ligne) => ({
            ficheId: id,
            collectiviteId,
            createdAt,
            ...ligne,
          }))
        );
      }
      return id;
    };

    await createFiche({
      createdAt: '2023-01-01T10:00:00Z',
      statut: StatutEnum.REALISE,
      historique: [
        {
          modifiedAt: '2024-03-01T10:00:00Z',
          statut: StatutEnum.EN_COURS,
          previousStatut: StatutEnum.A_VENIR,
        },
        {
          modifiedAt: '2025-06-01T10:00:00Z',
          statut: StatutEnum.REALISE,
          previousStatut: StatutEnum.EN_COURS,
        },
      ],
    });
    await createFiche({
      createdAt: '2024-01-01T10:00:00Z',
      statut: StatutEnum.EN_RETARD,
    });
    await createFiche({
      createdAt: '2025-09-01T10:00:00Z',
      statut: StatutEnum.REALISE,
    });
    await createFiche({
      createdAt: '2023-06-01T10:00:00Z',
      statut: StatutEnum.EN_COURS,
      ameliorationContinue: true,
    });
    await createFiche({
      createdAt: '2024-01-01T10:00:00Z',
      statut: StatutEnum.BLOQUE,
      thematiques: [thematiqueId],
      historique: [
        {
          modifiedAt: '2025-03-01T10:00:00Z',
          statut: StatutEnum.BLOQUE,
          previousStatut: StatutEnum.EN_PAUSE,
        },
      ],
    });
    const ficheSupprimee = await createFiche({
      createdAt: '2024-01-01T10:00:00Z',
      statut: StatutEnum.EN_COURS,
    });
    await caller.plans.fiches.delete({ ficheId: ficheSupprimee });

    return async () => {
      await app.close();
    };
  });

  const getEvolutionStatuts = (input: {
    dateDebut?: string;
    dateFin?: string;
    inclureActionsContinues?: boolean;
    thematiqueIds?: number[];
  }) =>
    router.createCaller({ user: admin }).plans.suivi.getEvolutionStatuts({
      planId,
      dateDebut: '2025-01-01',
      dateFin: '2025-12-31',
      ...input,
    });

  const countsOf = (
    parStatut: { statut: Statut | null; debut: number; fin: number }[]
  ) => parStatut.filter(({ debut, fin }) => debut > 0 || fin > 0);

  it('compte les fiches par statut aux deux dates, depuis l’historique, actions continues retirées', async () => {
    const evolution = await getEvolutionStatuts({});

    expect(evolution).toMatchObject({
      dateDebut: '2025-01-01',
      dateFin: '2025-12-31',
      dateDebutRamenee: false,
      totalDebut: 3,
      totalFin: 4,
      creeesDepuisDebut: 1,
      actionsContinues: 1,
    });
    expect(countsOf(evolution.parStatut)).toEqual([
      { statut: StatutEnum.EN_COURS, debut: 1, fin: 0 },
      { statut: StatutEnum.REALISE, debut: 0, fin: 2 },
      { statut: StatutEnum.EN_PAUSE, debut: 1, fin: 0 },
      { statut: StatutEnum.BLOQUE, debut: 0, fin: 1 },
      { statut: StatutEnum.EN_RETARD, debut: 1, fin: 1 },
    ]);
    expect(evolution.parStatut).toHaveLength(9);
  });

  it('inclut les actions continues dans les deux photos quand on le demande', async () => {
    const evolution = await getEvolutionStatuts({
      inclureActionsContinues: true,
    });

    expect(evolution).toMatchObject({
      totalDebut: 4,
      totalFin: 5,
      actionsContinues: 1,
    });
    expect(
      evolution.parStatut.find(({ statut }) => statut === StatutEnum.EN_COURS)
    ).toEqual({ statut: StatutEnum.EN_COURS, debut: 2, fin: 1 });
  });

  it('ne retient que les fiches portant une des thématiques choisies', async () => {
    const evolution = await getEvolutionStatuts({
      thematiqueIds: [thematiqueId],
    });

    expect(evolution).toMatchObject({
      totalDebut: 1,
      totalFin: 1,
      creeesDepuisDebut: 0,
      actionsContinues: 0,
    });
    expect(countsOf(evolution.parStatut)).toEqual([
      { statut: StatutEnum.EN_PAUSE, debut: 1, fin: 0 },
      { statut: StatutEnum.BLOQUE, debut: 0, fin: 1 },
    ]);
  });

  it('ramène une date antérieure au 11/12/2023 à cette date', async () => {
    const evolution = await getEvolutionStatuts({ dateDebut: '2022-01-01' });

    expect(evolution).toMatchObject({
      dateDebut: '2023-12-11',
      dateDebutRamenee: true,
      totalDebut: 1,
      creeesDepuisDebut: 3,
    });
    expect(countsOf(evolution.parStatut)[0]).toEqual({
      statut: StatutEnum.A_VENIR,
      debut: 1,
      fin: 0,
    });
  });

  it('refuse une date de début postérieure à la date de fin', async () => {
    await expect(
      getEvolutionStatuts({ dateDebut: '2026-01-01', dateFin: '2025-01-01' })
    ).rejects.toThrow();
  });
});
