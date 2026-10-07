import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
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
  FicheWithRelations,
  ListFichesRequestFilters,
  PrioriteEnum,
  StatutEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

describe('listFiches et la confidentialité', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectiviteId: number;
  let ficheRestreinteId: number;
  let ficheOuverteId: number;
  let ficheRestreintNullId: number;
  let membreEnLecture: AuthenticatedUser;
  let visiteurVerifie: AuthenticatedUser;

  beforeAll(async () => {
    const app: INestApplication = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;

    const { user: membre } = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    membreEnLecture = getAuthUserFromUserCredentials(membre);

    const { user: visiteur } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    visiteurVerifie = getAuthUserFromUserCredentials(visiteur);

    const fiches = await db.db
      .insert(ficheActionTable)
      .values([
        {
          titre: 'Fiche restreinte',
          description: 'Description confidentielle',
          objectifs: 'Objectifs confidentiels',
          statut: StatutEnum.EN_COURS,
          priorite: PrioriteEnum.ÉLEVÉ,
          dateFin: '2027-03-04',
          restreint: true,
          collectiviteId,
        },
        { titre: 'Fiche ouverte', restreint: false, collectiviteId },
        {
          titre: 'Fiche sans confidentialité renseignée',
          restreint: null,
          collectiviteId,
        },
      ])
      .returning();
    ficheRestreinteId = fiches[0].id;
    ficheOuverteId = fiches[1].id;
    ficheRestreintNullId = fiches[2].id;

    return async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId));
      await app.close();
    };
  });

  const listFichesFor = async (
    user: AuthenticatedUser,
    filters: ListFichesRequestFilters = {}
  ): Promise<{ count: number; data: FicheWithRelations[] }> => {
    return router
      .createCaller({ user })
      .plans.fiches.listFiches({ collectiviteId, filters });
  };

  const listedFicheIdsFor = async (
    user: AuthenticatedUser,
    filters: ListFichesRequestFilters = {}
  ): Promise<Set<number>> => {
    const { data } = await listFichesFor(user, filters);
    return new Set(data.map((fiche) => fiche.id));
  };

  it('liste et compte les trois fiches pour un visiteur vérifié non membre', async () => {
    const { count, data } = await listFichesFor(visiteurVerifie);
    expect({ count, ids: new Set(data.map((fiche) => fiche.id)) }).toEqual({
      count: 3,
      ids: new Set([ficheRestreinteId, ficheOuverteId, ficheRestreintNullId]),
    });
  });

  it('rend au visiteur vérifié la fiche restreinte réduite aux champs de sa carte', async () => {
    const { data } = await listFichesFor(visiteurVerifie);
    expect(data.find((fiche) => fiche.id === ficheRestreinteId)).toMatchObject({
      titre: 'Fiche restreinte',
      statut: StatutEnum.EN_COURS,
      priorite: PrioriteEnum.ÉLEVÉ,
      dateFin: '2027-03-04T00:00:00.000Z',
      restreint: true,
      description: null,
      objectifs: null,
      completion: {
        fields: expect.arrayContaining([
          { field: 'description', isCompleted: false },
        ]),
      },
    });
  });

  it('rend au membre en lecture la fiche restreinte entière', async () => {
    const { data } = await listFichesFor(membreEnLecture);
    expect(data.find((fiche) => fiche.id === ficheRestreinteId)).toMatchObject({
      titre: 'Fiche restreinte',
      description: 'Description confidentielle',
      objectifs: 'Objectifs confidentiels',
    });
  });

  it('rend la fiche restreinte au visiteur vérifié qui filtre les fiches restreintes', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, { restreint: true })
    ).toEqual(new Set([ficheRestreinteId]));
  });

  it('rend au visiteur vérifié la fiche restreinte désignée par son identifiant', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, {
        ficheIds: [ficheRestreinteId],
      })
    ).toEqual(new Set([ficheRestreinteId]));
  });

  it('écarte la fiche restreinte du visiteur vérifié qui filtre les fiches avec une description', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, { noDescription: false })
    ).toEqual(new Set());
  });

  it('ne rend rien au visiteur vérifié qui filtre les fiches restreintes avec une description', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, {
        restreint: true,
        noDescription: false,
      })
    ).toEqual(new Set());
  });

  it('rend au visiteur vérifié la fiche restreinte dont le titre contient le texte cherché', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, {
        texteNomOuDescription: 'Fiche',
      })
    ).toEqual(
      new Set([ficheRestreinteId, ficheOuverteId, ficheRestreintNullId])
    );
  });

  it('rend au visiteur vérifié la fiche restreinte dont le titre contient le texte cherché, quand il filtre les fiches restreintes', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, {
        restreint: true,
        texteNomOuDescription: 'Fiche',
      })
    ).toEqual(new Set([ficheRestreinteId]));
  });

  it('écarte la fiche restreinte du visiteur vérifié quand le texte cherché est dans sa description seulement', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, {
        texteNomOuDescription: 'confidentielle',
      })
    ).toEqual(new Set());
  });

  it('ne rend rien au visiteur vérifié qui cherche dans la description des fiches restreintes', async () => {
    expect(
      await listedFicheIdsFor(visiteurVerifie, {
        restreint: true,
        texteNomOuDescription: 'confidentielle',
      })
    ).toEqual(new Set());
  });

  it('rend la fiche restreinte au membre en lecture quand le texte cherché est dans sa description seulement', async () => {
    expect(
      await listedFicheIdsFor(membreEnLecture, {
        texteNomOuDescription: 'confidentielle',
      })
    ).toEqual(new Set([ficheRestreinteId]));
  });

  it('rend la fiche restreinte au membre en lecture qui filtre sur un champ absent de la carte', async () => {
    expect(
      await listedFicheIdsFor(membreEnLecture, {
        texteNomOuDescription: 'Fiche',
      })
    ).toEqual(
      new Set([ficheRestreinteId, ficheOuverteId, ficheRestreintNullId])
    );
  });

  it('compte par statut la fiche restreinte pour le visiteur vérifié', async () => {
    const countByStatutResult = await router
      .createCaller({ user: visiteurVerifie })
      .plans.fiches.countBy({
        collectiviteId,
        countByProperty: 'statut',
        filter: {},
      });
    expect({
      total: countByStatutResult.total,
      enCours: countByStatutResult.countByResult[StatutEnum.EN_COURS]?.count,
    }).toEqual({ total: 3, enCours: 1 });
  });

  it('ne compte pas la fiche restreinte pour le visiteur vérifié qui compte par un champ absent de la carte', async () => {
    const countByThematiquesResult = await router
      .createCaller({ user: visiteurVerifie })
      .plans.fiches.countBy({
        collectiviteId,
        countByProperty: 'thematiques',
        filter: {},
      });
    expect(countByThematiquesResult.total).toEqual(2);
  });

  it('rend la fiche à la confidentialité non renseignée au membre qui filtre les fiches non restreintes', async () => {
    const { data } = await router
      .createCaller({ user: membreEnLecture })
      .plans.fiches.listFiches({
        collectiviteId,
        filters: { restreint: false },
      });
    expect(new Set(data.map((fiche) => fiche.id))).toEqual(
      new Set([ficheOuverteId, ficheRestreintNullId])
    );
  });

  describe('fiche restreinte partagée avec une autre collectivité', () => {
    let collectiviteDestinataireId: number;
    let membreDestinataire: AuthenticatedUser;

    beforeAll(async () => {
      const { collectivite: destinataire } = await addTestCollectivite(db);
      collectiviteDestinataireId = destinataire.id;

      const { user: membre } = await addTestUser(db, {
        collectiviteId: collectiviteDestinataireId,
        role: CollectiviteRole.LECTURE,
      });
      membreDestinataire = getAuthUserFromUserCredentials(membre);

      await db.db.insert(ficheActionSharingTable).values({
        ficheId: ficheRestreinteId,
        collectiviteId: collectiviteDestinataireId,
      });
    });

    const findFicheRestreintePartageeFor = async (
      user: AuthenticatedUser
    ): Promise<FicheWithRelations | undefined> => {
      const { data } = await router
        .createCaller({ user })
        .plans.fiches.listFiches({
          collectiviteId: collectiviteDestinataireId,
        });
      return data.find((fiche) => fiche.id === ficheRestreinteId);
    };

    it('rend la fiche réduite à sa carte au visiteur vérifié qui liste la collectivité destinataire', async () => {
      expect(
        await findFicheRestreintePartageeFor(visiteurVerifie)
      ).toMatchObject({ titre: 'Fiche restreinte', description: null });
    });

    it('rend la fiche entière au membre en lecture de la collectivité destinataire', async () => {
      expect(
        await findFicheRestreintePartageeFor(membreDestinataire)
      ).toMatchObject({
        titre: 'Fiche restreinte',
        description: 'Description confidentielle',
      });
    });
  });
});
