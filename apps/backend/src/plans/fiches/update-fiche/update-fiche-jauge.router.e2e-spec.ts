import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { FichesRouter } from '@tet/backend/plans/fiches/fiches.router';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Statut, StatutEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { desc, eq } from 'drizzle-orm';
import { beforeAll, describe, expect } from 'vitest';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { historiqueFicheActionTable } from '../shared/models/historique-fiche-action.table';

describe('Mise à jour de la jauge et du statut d’une fiche', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let fichesRouter: FichesRouter;
  let editeur: AuthenticatedUser;
  let lecteur: AuthenticatedUser;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    fichesRouter = app.get(FichesRouter);
    db = await getTestDatabase(app);

    const { collectivite } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;

    const { user: editeurCredentials } = await addTestUser(db);
    await setUserCollectiviteRole(db, {
      userId: editeurCredentials.id,
      collectiviteId,
      role: CollectiviteRole.EDITION,
    });
    editeur = getAuthUserFromUserCredentials(editeurCredentials);

    const { user: lecteurCredentials } = await addTestUser(db);
    await setUserCollectiviteRole(db, {
      userId: lecteurCredentials.id,
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    lecteur = getAuthUserFromUserCredentials(lecteurCredentials);

    return async () => {
      await app.close();
    };
  });

  const insertFiche = async ({
    statut,
    jauge,
    parentId = null,
  }: {
    statut: Statut | null;
    jauge: number;
    parentId?: number | null;
  }): Promise<number> => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Rénover les écoles',
        description: 'Isoler les toitures',
        collectiviteId,
        statut,
        jauge,
        parentId,
      })
      .returning({ id: ficheActionTable.id });
    return fiche.id;
  };

  const updateFiche = (
    ficheId: number,
    ficheFields: { statut?: Statut | null; jauge?: number; titre?: string },
    user: AuthenticatedUser = editeur
  ) => fichesRouter.createCaller({ user }).update({ ficheId, ficheFields });

  const toTime = (date: string | null | undefined) =>
    new Date(date ?? 0).getTime();

  const getFiche = (ficheId: number) =>
    fichesRouter.createCaller({ user: editeur }).get({ id: ficheId });

  describe('Changement de statut', () => {
    test.each([
      {
        cas: 'À venir met la jauge à 0 %',
        avant: { statut: StatutEnum.EN_COURS, jauge: 60 },
        statut: StatutEnum.A_VENIR,
        jauge: 0,
      },
      {
        cas: 'Réalisé met la jauge à 100 %',
        avant: { statut: StatutEnum.EN_COURS, jauge: 60 },
        statut: StatutEnum.REALISE,
        jauge: 100,
      },
      {
        cas: 'Réalisé vers En cours met la jauge à 95 %',
        avant: { statut: StatutEnum.REALISE, jauge: 100 },
        statut: StatutEnum.EN_COURS,
        jauge: 95,
      },
      {
        cas: 'Réalisé vers En retard met la jauge à 95 %',
        avant: { statut: StatutEnum.REALISE, jauge: 100 },
        statut: StatutEnum.EN_RETARD,
        jauge: 95,
      },
      {
        cas: 'Réalisé vers A discuter met la jauge à 95 %',
        avant: { statut: StatutEnum.REALISE, jauge: 100 },
        statut: StatutEnum.A_DISCUTER,
        jauge: 95,
      },
      {
        cas: 'Réalisé vers En pause garde la jauge à 100 %',
        avant: { statut: StatutEnum.REALISE, jauge: 100 },
        statut: StatutEnum.EN_PAUSE,
        jauge: 100,
      },
      {
        cas: 'Réalisé vers Bloqué garde la jauge à 100 %',
        avant: { statut: StatutEnum.REALISE, jauge: 100 },
        statut: StatutEnum.BLOQUE,
        jauge: 100,
      },
      {
        cas: 'Réalisé vers Abandonné garde la jauge à 100 %',
        avant: { statut: StatutEnum.REALISE, jauge: 100 },
        statut: StatutEnum.ABANDONNE,
        jauge: 100,
      },
      {
        cas: 'En cours vers En retard garde la jauge',
        avant: { statut: StatutEnum.EN_COURS, jauge: 40 },
        statut: StatutEnum.EN_RETARD,
        jauge: 40,
      },
    ])('$cas', async ({ avant, statut, jauge }) => {
      const ficheId = await insertFiche(avant);

      const fiche = await updateFiche(ficheId, { statut });

      expect(fiche).toMatchObject({ statut, jauge });
    });
  });

  describe('Changement de jauge', () => {
    test.each([
      {
        cas: 'jauge mise à 100 % passe la fiche en Réalisé',
        avant: { statut: StatutEnum.EN_COURS, jauge: 60 },
        jauge: 100,
        statut: StatutEnum.REALISE,
      },
      {
        cas: 'jauge baissée sous 100 % sur Réalisé passe la fiche En cours',
        avant: { statut: StatutEnum.REALISE, jauge: 100 },
        jauge: 80,
        statut: StatutEnum.EN_COURS,
      },
      {
        cas: 'jauge montée au-dessus de 0 % sur À venir passe la fiche En cours',
        avant: { statut: StatutEnum.A_VENIR, jauge: 0 },
        jauge: 5,
        statut: StatutEnum.EN_COURS,
      },
      {
        cas: 'jauge modifiée sur En retard garde le statut',
        avant: { statut: StatutEnum.EN_RETARD, jauge: 20 },
        jauge: 45,
        statut: StatutEnum.EN_RETARD,
      },
      {
        cas: 'jauge ramenée à 0 % sur En cours garde le statut',
        avant: { statut: StatutEnum.EN_COURS, jauge: 20 },
        jauge: 0,
        statut: StatutEnum.EN_COURS,
      },
    ])('$cas', async ({ avant, jauge, statut }) => {
      const ficheId = await insertFiche(avant);

      const fiche = await updateFiche(ficheId, { jauge });

      expect(fiche).toMatchObject({ statut, jauge });
    });
  });

  describe('Statut et jauge changés ensemble', () => {
    test('le statut l’emporte : Réalisé avec une jauge à 40 % donne 100 %', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 20,
      });

      const fiche = await updateFiche(ficheId, {
        statut: StatutEnum.REALISE,
        jauge: 40,
      });

      expect(fiche).toMatchObject({ statut: StatutEnum.REALISE, jauge: 100 });
    });

    test('le statut l’emporte : En retard avec une jauge à 60 % garde la jauge', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 20,
      });

      const fiche = await updateFiche(ficheId, {
        statut: StatutEnum.EN_RETARD,
        jauge: 60,
      });

      expect(fiche).toMatchObject({ statut: StatutEnum.EN_RETARD, jauge: 20 });
    });

    test('un statut inchangé laisse la jauge s’appliquer', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.A_VENIR,
        jauge: 0,
      });

      const fiche = await updateFiche(ficheId, {
        statut: StatutEnum.A_VENIR,
        jauge: 30,
      });

      expect(fiche).toMatchObject({ statut: StatutEnum.EN_COURS, jauge: 30 });
    });
  });

  describe('Refus', () => {
    test.each([
      { cas: 'hors pas', jauge: 42 },
      { cas: 'sous 0 %', jauge: -5 },
      { cas: 'au-dessus de 100 %', jauge: 105 },
    ])('jauge $cas refusée', async ({ jauge }) => {
      const ficheId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 20,
      });

      await expect(updateFiche(ficheId, { jauge })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message:
          "L'avancement doit être compris entre 0 et 100 %, par pas de 5 %",
      });
      expect((await getFiche(ficheId)).jauge).toBe(20);
    });

    test.each([StatutEnum.ABANDONNE, StatutEnum.EN_PAUSE, StatutEnum.BLOQUE])(
      'jauge modifiée sur %s refusée',
      async (statut) => {
        const ficheId = await insertFiche({ statut, jauge: 30 });

        await expect(updateFiche(ficheId, { jauge: 50 })).rejects.toMatchObject(
          {
            code: 'BAD_REQUEST',
            message:
              "L'avancement d'une action abandonnée, en pause ou bloquée ne peut pas être modifié",
          }
        );
        expect((await getFiche(ficheId)).jauge).toBe(30);
      }
    );

    test('jauge inchangée acceptée sur un statut qui la fige', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.BLOQUE,
        jauge: 30,
      });

      const fiche = await updateFiche(ficheId, {
        jauge: 30,
        titre: 'Rénover les crèches',
      });

      expect(fiche).toMatchObject({
        statut: StatutEnum.BLOQUE,
        jauge: 30,
        titre: 'Rénover les crèches',
      });
    });

    test('jauge refusée sur une sous-action', async () => {
      const parentId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 20,
      });
      const sousActionId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 0,
        parentId,
      });

      await expect(
        updateFiche(sousActionId, { jauge: 50 })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: "Une sous-action n'a pas d'avancement",
      });
    });

    test('une sous-action passée en Réalisé garde sa jauge à 0 %', async () => {
      const parentId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 20,
      });
      const sousActionId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 0,
        parentId,
      });

      const fiche = await updateFiche(sousActionId, {
        statut: StatutEnum.REALISE,
      });

      expect(fiche).toMatchObject({ statut: StatutEnum.REALISE, jauge: 0 });
    });
  });

  describe('Droits', () => {
    test('un lecteur ne peut pas modifier la jauge', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 20,
      });

      await expect(
        updateFiche(ficheId, { jauge: 50 }, lecteur)
      ).rejects.toThrowError(/Droits insuffisants/i);
      expect((await getFiche(ficheId)).jauge).toBe(20);
    });

    test('un éditeur peut modifier la jauge', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 20,
      });

      const fiche = await updateFiche(ficheId, { jauge: 50 });

      expect(fiche.jauge).toBe(50);
    });
  });

  describe('Historique et lecture', () => {
    test('la jauge fait partie de la fiche lue', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 35,
      });

      expect((await getFiche(ficheId)).jauge).toBe(35);
    });

    test('une modification de jauge écrit jauge et previous_jauge avec le statut', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.A_VENIR,
        jauge: 0,
      });
      await updateFiche(ficheId, { jauge: 25 });

      const [ligne] = await db.db
        .select()
        .from(historiqueFicheActionTable)
        .where(eq(historiqueFicheActionTable.ficheId, ficheId))
        .orderBy(desc(historiqueFicheActionTable.modifiedAt))
        .limit(1);
      expect(ligne).toMatchObject({
        titre: 'Rénover les écoles',
        previousTitre: 'Rénover les écoles',
        description: 'Isoler les toitures',
        previousDescription: 'Isoler les toitures',
        restreint: false,
        previousRestreint: false,
        jauge: 25,
        previousJauge: 0,
        statut: StatutEnum.EN_COURS,
        previousStatut: StatutEnum.A_VENIR,
        collectiviteId,
        modifiedBy: editeur.id,
        deleted: false,
      });
      expect(ligne.previousModifiedAt).not.toBeNull();
      expect(ligne.createdAt).not.toBeNull();
    });

    test('la date de mise à jour de la jauge suit le dernier changement de jauge', async () => {
      const ficheId = await insertFiche({
        statut: StatutEnum.EN_COURS,
        jauge: 0,
      });
      expect((await getFiche(ficheId)).jaugeModifiedAt).toBeNull();

      await updateFiche(ficheId, { jauge: 40 });
      const { jaugeModifiedAt: premierChangement } = await getFiche(ficheId);
      expect(premierChangement).not.toBeNull();

      await updateFiche(ficheId, { titre: 'Rénover les gymnases' });
      expect((await getFiche(ficheId)).jaugeModifiedAt).toBe(premierChangement);

      await updateFiche(ficheId, { jauge: 60 });
      const { jaugeModifiedAt: deuxiemeChangement } = await getFiche(ficheId);
      expect(toTime(deuxiemeChangement)).toBeGreaterThan(
        toTime(premierChangement)
      );

      await updateFiche(ficheId, { jauge: 40 });
      const { jaugeModifiedAt: retourArriere } = await getFiche(ficheId);
      expect(toTime(retourArriere)).toBeGreaterThan(toTime(deuxiemeChangement));
    });
  });
});
