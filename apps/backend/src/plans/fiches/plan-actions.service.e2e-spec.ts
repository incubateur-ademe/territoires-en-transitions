import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import PlanActionsService from '@tet/backend/plans/fiches/plan-actions.service';
import { ficheActionSecteurAttributionTable } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-action-secteur-attribution.table';
import { ficheActionNoteTable } from '@tet/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
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
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { OrigineSecteursEnum } from '@tet/domain/plans';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';

describe('PlanActionsService', () => {
  let db: DatabaseService;
  let app: INestApplication;
  let planService: PlanActionsService;
  let user: AuthenticatedUser;
  let collectivite: Collectivite;
  let planId: number;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    planService = app.get(PlanActionsService);
    const router = await getTestRouter(app);

    // Collectivité et utilisateur isolés
    const testResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    user = getAuthUserFromUserCredentials(testResult.user);

    // Crée un plan pour la collectivité
    const caller = router.createCaller({ user });
    const plan = await caller.plans.plans.create({
      nom: 'Plan test soft-delete',
      collectiviteId: collectivite.id,
    });
    planId = plan.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("n'inclut pas les fiches supprimées (soft delete) dans le plan", async () => {
    // insère une fiche marquée comme supprimée et l'associe au plan
    const [ficheDeleted] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: collectivite.id,
        titre: 'Fiche supprimée (export)',
        restreint: false,
        deleted: true,
      })
      .returning();

    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: ficheDeleted.id, axeId: planId, createdBy: user.id });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, ficheDeleted.id));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheDeleted.id));
    });

    const plan = await planService.getPlan(
      { collectiviteId: collectivite.id, planId },
      user
    );
    const hasDeleted = plan.rows.some((r) => r.fiche?.id === ficheDeleted.id);
    expect(hasDeleted).toBe(false);
  });

  describe('fiche restreinte', () => {
    let ficheRestreinteId: number;
    let verifiedVisitor: AuthenticatedUser;

    beforeAll(async () => {
      const [ficheRestreinte] = await db.db
        .insert(ficheActionTable)
        .values({
          collectiviteId: collectivite.id,
          titre: 'Fiche restreinte (export)',
          restreint: true,
        })
        .returning();
      ficheRestreinteId = ficheRestreinte.id;

      await db.db.insert(ficheActionAxeTable).values({
        ficheId: ficheRestreinteId,
        axeId: planId,
        createdBy: user.id,
      });

      const { user: visiteur } = await addTestUser(db, {
        collectiviteId: null,
        role: CollectiviteRole.LECTURE,
      });
      verifiedVisitor = getAuthUserFromUserCredentials(visiteur);

      return async () => {
        await db.db
          .delete(ficheActionAxeTable)
          .where(eq(ficheActionAxeTable.ficheId, ficheRestreinteId));
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, ficheRestreinteId));
      };
    });

    const exportedFicheIdsFor = async (
      exporter: AuthenticatedUser
    ): Promise<(number | undefined)[]> => {
      const plan = await planService.getPlan(
        { collectiviteId: collectivite.id, planId },
        exporter
      );
      return plan.rows.map((row) => row.fiche?.id);
    };

    it("n'exporte pas la fiche restreinte pour un visiteur vérifié non membre", async () => {
      expect(await exportedFicheIdsFor(verifiedVisitor)).not.toContain(
        ficheRestreinteId
      );
    });

    it('exporte la fiche restreinte pour un membre qui peut la lire', async () => {
      expect(await exportedFicheIdsFor(user)).toContain(ficheRestreinteId);
    });
  });
  describe('sous-actions et secteurs réglementaires', () => {
    let planWithSousActionsId: number;
    let verifiedVisitor: AuthenticatedUser;
    let ficheId: number;
    let ficheRestreinteId: number;
    let firstSousActionId: number;
    let secondSousActionId: number;
    let sousActionRestreinteId: number;
    let sousActionDeFicheRestreinteId: number;

    beforeAll(async () => {
      const router = await getTestRouter(app);
      const caller = router.createCaller({ user });
      const plan = await caller.plans.plans.create({
        nom: 'Plan avec sous-actions',
        collectiviteId: collectivite.id,
      });
      planWithSousActionsId = plan.id;

      const { user: visiteur } = await addTestUser(db, {
        collectiviteId: null,
        role: CollectiviteRole.LECTURE,
      });
      verifiedVisitor = getAuthUserFromUserCredentials(visiteur);

      // collectivité de test dédiée : pas de nettoyage
      const addFiche = async ({
        createdAt,
        ...fiche
      }: { titre: string; restreint?: boolean } & (
        | { axeId: number; createdAt?: undefined }
        | { parentId: number; createdAt: string }
      )) => {
        const { ficheId } = await createFicheAndCleanupFunction({
          caller,
          ficheInput: { collectiviteId: collectivite.id, ...fiche },
        });
        // la création n'accepte pas de date : elle est écrite en base ensuite
        if (createdAt) {
          await db.db
            .update(ficheActionTable)
            .set({ createdAt })
            .where(eq(ficheActionTable.id, ficheId));
        }
        return ficheId;
      };

      ficheId = await addFiche({
        titre: 'A - Fiche visible',
        axeId: planWithSousActionsId,
      });
      ficheRestreinteId = await addFiche({
        titre: 'B - Fiche restreinte',
        restreint: true,
        axeId: planWithSousActionsId,
      });
      // créée avant la première mais datée après : l'ordre suit la date de
      // création, pas l'identifiant
      secondSousActionId = await addFiche({
        titre: 'Seconde sous-action',
        parentId: ficheId,
        createdAt: '2024-02-01T00:00:00.000Z',
      });
      firstSousActionId = await addFiche({
        titre: 'Première sous-action',
        parentId: ficheId,
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      sousActionRestreinteId = await addFiche({
        titre: 'Sous-action restreinte',
        restreint: true,
        parentId: ficheId,
        createdAt: '2024-03-01T00:00:00.000Z',
      });
      sousActionDeFicheRestreinteId = await addFiche({
        titre: "Sous-action d'une fiche restreinte",
        parentId: ficheRestreinteId,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      await db.db.insert(ficheActionSecteurAttributionTable).values([
        {
          ficheId,
          secteurs: ['residentiel', 'transport_routier'],
          origine: OrigineSecteursEnum.MANUELLE,
        },
        {
          ficheId: firstSousActionId,
          secteurs: [],
          origine: OrigineSecteursEnum.AUTOMATIQUE,
        },
        {
          ficheId: sousActionDeFicheRestreinteId,
          secteurs: ['eau'],
          origine: OrigineSecteursEnum.MANUELLE,
        },
      ]);

      // seule une sous-action porte une note de 2019
      await db.db.insert(ficheActionNoteTable).values({
        ficheId: firstSousActionId,
        dateNote: '2019-06-01',
        note: 'Note de sous-action',
        createdBy: user.id,
        modifiedBy: user.id,
      });
    });

    const input = () => ({
      collectiviteId: collectivite.id,
      planId: planWithSousActionsId,
    });

    it('place les sous-actions sous leur fiche parente, par date de création', async () => {
      const plan = await planService.getPlan(input(), user);

      expect(
        plan.rows.map((row) => [row.fiche?.id, row.parentFiche?.id ?? null])
      ).toEqual([
        [ficheId, null],
        [firstSousActionId, ficheId],
        [secondSousActionId, ficheId],
        [sousActionRestreinteId, ficheId],
        [ficheRestreinteId, null],
        [sousActionDeFicheRestreinteId, ficheRestreinteId],
      ]);
    });

    it("compte les notes d'une sous-action dans les années de notes", async () => {
      const plan = await planService.getPlan(input(), user);

      expect(plan.anneesNotes).toEqual([2019]);
    });

    it('rend les secteurs des fiches et des sous-actions', async () => {
      const plan = await planService.getPlan(input(), user);
      const secteursByFicheId = new Map(
        plan.rows.map((row) => [row.fiche?.id, row.secteurs])
      );

      expect(secteursByFicheId.get(ficheId)).toEqual({
        etat: 'attribue',
        secteurs: ['residentiel', 'transport_routier'],
        origine: 'manuelle',
      });
      expect(secteursByFicheId.get(firstSousActionId)).toEqual({
        etat: 'non_attribuable',
        origine: 'automatique',
      });
      expect(secteursByFicheId.get(secondSousActionId)).toBeNull();
    });

    it("n'exporte ni la fiche restreinte ni les sous-actions restreintes à un lecteur sans accès", async () => {
      const plan = await planService.getPlan(input(), verifiedVisitor);

      expect(plan.rows.map((row) => row.fiche?.id)).toEqual([
        ficheId,
        firstSousActionId,
        secondSousActionId,
      ]);
    });

    describe('getPlanSnapshot', () => {
      it('rend les fiches restreintes dans le plan complet et les écarte de la variante', async () => {
        const { plan, planWithoutFichesRestreintes } =
          await planService.getPlanSnapshot(input());

        expect(plan.rows.map((row) => row.fiche?.id)).toEqual([
          ficheId,
          firstSousActionId,
          secondSousActionId,
          sousActionRestreinteId,
          ficheRestreinteId,
          sousActionDeFicheRestreinteId,
        ]);
        expect(
          planWithoutFichesRestreintes?.rows.map((row) => row.fiche?.id)
        ).toEqual([ficheId, firstSousActionId, secondSousActionId]);
        expect(planWithoutFichesRestreintes?.root.id).toBe(
          planWithSousActionsId
        );
      });

      it("rend le même plan complet que l'export d'un membre qui lit tout", async () => {
        const { plan } = await planService.getPlanSnapshot(input());
        const memberPlan = await planService.getPlan(input(), user);

        expect(plan.rows.map((row) => [row.fiche?.id, row.secteurs])).toEqual(
          memberPlan.rows.map((row) => [row.fiche?.id, row.secteurs])
        );
      });

      it("ne rend pas de variante quand aucune fiche n'est restreinte", async () => {
        const { planWithoutFichesRestreintes } =
          await planService.getPlanSnapshot({
            collectiviteId: collectivite.id,
            planId,
          });

        expect(planWithoutFichesRestreintes).toBeNull();
      });
    });
  });
});
