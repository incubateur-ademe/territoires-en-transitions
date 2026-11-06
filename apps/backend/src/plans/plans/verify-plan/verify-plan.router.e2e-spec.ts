import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import {
  OrigineSecteursEnum,
  PlanSourceEnum,
  PlanStatusEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import { ficheActionSecteurAttributionTable } from '../../fiches/fiche-secteurs/fiche-action-secteur-attribution.table';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '../../fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../../fiches/shared/models/fiche-action.table';
import { planActionTypeTable } from '../../fiches/shared/models/plan-action-type.table';

describe('Valider un plan importé', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectivite: Collectivite;
  let editor: AuthenticatedUser;
  let otherEditor: AuthenticatedUser;
  let reader: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const fixture = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.LECTURE },
      ],
    });
    collectivite = fixture.collectivite;
    [editor, otherEditor, reader] = fixture.users.map((user) =>
      getAuthUserFromUserCredentials(user)
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const createPlan = async ({ imported }: { imported: boolean }) => {
    const plan = await router
      .createCaller({ user: editor })
      .plans.plans.create({
        nom: 'Plan importé',
        collectiviteId: collectivite.id,
      });
    if (imported) {
      await db.db
        .update(axeTable)
        .set({
          source: PlanSourceEnum.IMPORT_IA,
          status: PlanStatusEnum.TO_VERIFY,
        })
        .where(eq(axeTable.id, plan.id));
    }
    return plan.id;
  };

  const readVerification = async (planId: number) => {
    const [row] = await db.db
      .select({
        verifiedAt: axeTable.verifiedAt,
        verifiedBy: axeTable.verifiedBy,
      })
      .from(axeTable)
      .where(eq(axeTable.id, planId));
    return row;
  };

  test('un plan importé non vérifié est exposé comme tel par plans.get', async () => {
    const planId = await createPlan({ imported: true });

    const plan = await router
      .createCaller({ user: editor })
      .plans.plans.get({ planId });

    expect(plan).toMatchObject({
      source: 'import_ia',
      status: 'to_verify',
      verifiedAt: null,
    });
  });

  test('valide un plan importé : date et auteur de la vérification', async () => {
    const planId = await createPlan({ imported: true });

    const result = await router
      .createCaller({ user: editor })
      .plans.plans.verify({ planId });

    expect(result.verifiedAt).toBeTruthy();
    expect(await readVerification(planId)).toMatchObject({
      verifiedBy: editor.id,
    });
    const plan = await router
      .createCaller({ user: editor })
      .plans.plans.get({ planId });
    expect(plan.verifiedAt).toBeTruthy();
    expect(plan.status).toBe('active');
  });

  test("refuse de valider un plan dont l'import n'est pas terminé", async () => {
    const planId = await createPlan({ imported: true });
    await db.db
      .update(axeTable)
      .set({ status: PlanStatusEnum.IMPORTING })
      .where(eq(axeTable.id, planId));

    await expect(
      router.createCaller({ user: editor }).plans.plans.verify({ planId })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect((await readVerification(planId)).verifiedAt).toBeNull();
  });

  test('une seconde validation ne réécrit pas la première', async () => {
    const planId = await createPlan({ imported: true });
    await router.createCaller({ user: editor }).plans.plans.verify({ planId });
    const first = await readVerification(planId);

    await router
      .createCaller({ user: otherEditor })
      .plans.plans.verify({ planId });

    expect(await readVerification(planId)).toEqual(first);
  });

  test('refuse de valider un plan créé à la main', async () => {
    const planId = await createPlan({ imported: false });

    await expect(
      router.createCaller({ user: editor }).plans.plans.verify({ planId })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(await readVerification(planId)).toMatchObject({
      verifiedAt: null,
      verifiedBy: null,
    });
  });

  test('refuse la validation à un utilisateur en lecture', async () => {
    const planId = await createPlan({ imported: true });

    await expect(
      router.createCaller({ user: reader }).plans.plans.verify({ planId })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await readVerification(planId)).verifiedAt).toBeNull();
  });

  test('refuse de valider un plan PCAET dont une action attend son secteur réglementaire', async () => {
    const trackingService = app.get(TrackingService);
    const isFeatureEnabled =
      trackingService.isFeatureEnabled.bind(trackingService);
    const spy = vi
      .spyOn(trackingService, 'isFeatureEnabled')
      .mockImplementation(async (feature, ...args) =>
        feature === 'is-fiche-secteurs-enabled'
          ? true
          : isFeatureEnabled(feature, ...args)
      );
    onTestFinished(() => {
      spy.mockRestore();
    });

    const planId = await createPlan({ imported: true });
    const [pcaetType] = await db.db
      .select({ id: planActionTypeTable.id })
      .from(planActionTypeTable)
      .where(
        and(
          eq(planActionTypeTable.categorie, PCAET_PLAN_TYPE_KEY.categorie),
          eq(planActionTypeTable.type, PCAET_PLAN_TYPE_KEY.type)
        )
      );
    await db.db
      .update(axeTable)
      .set({ typeId: pcaetType.id })
      .where(eq(axeTable.id, planId));
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({ titre: 'Rénover les écoles', collectiviteId: collectivite.id })
      .returning({ id: ficheActionTable.id });
    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: fiche.id, axeId: planId, createdBy: editor.id });
    await db.db.insert(ficheActionSecteurAttributionTable).values({
      ficheId: fiche.id,
      origine: OrigineSecteursEnum.INDISPONIBLE,
      secteurs: [],
    });

    const caller = router.createCaller({ user: editor });
    await expect(caller.plans.plans.verify({ planId })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('secteur réglementaire'),
    });
    expect((await readVerification(planId)).verifiedAt).toBeNull();

    await caller.plans.fiches.upsertSecteurs({
      ficheId: fiche.id,
      secteurs: ['residentiel'],
    });
    const result = await caller.plans.plans.verify({ planId });
    expect(result.verifiedAt).toBeTruthy();
  });

  test("renvoie NOT_FOUND pour un plan qui n'existe pas", async () => {
    await expect(
      router
        .createCaller({ user: editor })
        .plans.plans.verify({ planId: 999_999_999 })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
