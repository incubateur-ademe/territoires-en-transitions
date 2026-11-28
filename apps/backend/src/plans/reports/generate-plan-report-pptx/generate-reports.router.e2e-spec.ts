import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { ReportGeneration, Statut, StatutEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { Automizer } from 'pptx-automizer';
import { TrpcRouter } from '../../../utils/trpc/trpc.router';

const SEED_DATA_PLAN_ID = 1;
const SEED_DATA_COLLECTIVITE_ID = 1;

describe('generate-reports.router.e2e-spec.ts', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let adminUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    // User with admin access to seed collectivite
    const adminResult = await addTestUser(db, {
      collectiviteId: SEED_DATA_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    adminUser = getAuthUserFromUserCredentials(adminResult.user);

    // User without access (for permission test)
    const noAccessResult = await addTestUser(db);
    noAccessUser = getAuthUserFromUserCredentials(noAccessResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Génère un rapport de plan au format PPTX', async () => {
    const caller = router.createCaller({ user: adminUser });
    const reportGeneration = await caller.plans.reports.create({
      planId: SEED_DATA_PLAN_ID,
      templateKey: 'general_bilan_template',
    });

    const expectedFileName =
      /^Rapport_Amberieu-en-Bugey_Plan Velo 2020-2024.*\.pptx$/;

    expect(reportGeneration.name).toMatch(expectedFileName);

    const getReportGeneration = (): Promise<ReportGeneration> =>
      caller.plans.reports.get({ reportId: reportGeneration.id });

    await expect
      .poll(async () => (await getReportGeneration()).status, {
        interval: 2000,
        timeout: 60000,
      })
      .toMatch(/^(completed|failed)$/);

    const updatedReportGeneration = await getReportGeneration();
    expect(
      updatedReportGeneration.status,
      `Report generation failed: ${updatedReportGeneration.errorMessage}`
    ).toBe('completed');

    const fichierId = updatedReportGeneration.fileId;
    if (fichierId === null) {
      throw new Error('A completed report must carry a fileId');
    }

    const { signedUrl, filename } =
      await caller.collectivites.documents.getDownloadUrl({
        collectiviteId: SEED_DATA_COLLECTIVITE_ID,
        fichierId,
      });

    expect(filename).toMatch(expectedFileName);

    const response = await fetch(signedUrl);
    expect(response.ok).toBe(true);

    const reportBuffer = Buffer.from(await response.arrayBuffer());
    expect(reportBuffer.byteLength).toBeGreaterThan(1000);
  }, 90000);

  it("Refuse la génération de rapport si l'utilisateur n'a pas les droits", async () => {
    const caller = router.createCaller({ user: noAccessUser });

    await expect(() =>
      caller.plans.reports.create({
        planId: SEED_DATA_PLAN_ID,
        templateKey: 'general_bilan_template',
      })
    ).rejects.toThrowError(/Vous n'avez pas les permissions nécessaires/i);
  });

  it("Donne l'avancement du plan et de chaque axe : moyenne des jauges des fiches parentes, Abandonné exclu", async () => {
    const db = await getTestDatabase(app);
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const collectiviteId = collectivite.id;
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const plan = await caller.plans.plans.create({
      nom: 'Plan avancement',
      collectiviteId,
    });
    const createAxe = async (nom: string, parent: number) =>
      (
        await caller.plans.axes.create({
          nom,
          collectiviteId,
          planId: plan.id,
          parent,
        })
      ).id;
    const axeBatiments = await createAxe('Axe Bâtiments', plan.id);
    const sousAxeEcoles = await createAxe('Écoles', axeBatiments);
    const sousAxeGymnases = await createAxe('Gymnases', axeBatiments);
    const axeMobilite = await createAxe('Axe Mobilité', plan.id);

    const createFiche = async ({
      axes = [],
      statuts,
      jauge,
      parentId,
      titre = 'Action',
    }: {
      titre?: string;
      axes?: number[];
      statuts: Statut[];
      jauge?: number;
      parentId?: number;
    }) => {
      const { id } = await caller.plans.fiches.create({
        fiche: { titre, collectiviteId, parentId },
      });
      if (axes.length) {
        await caller.plans.fiches.update({
          ficheId: id,
          ficheFields: { axes: axes.map((axeId) => ({ id: axeId })) },
        });
      }
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
      return id;
    };

    await createFiche({
      axes: [sousAxeEcoles, sousAxeGymnases],
      statuts: [StatutEnum.EN_COURS],
      jauge: 40,
    });
    await createFiche({
      axes: [sousAxeEcoles, axeMobilite],
      statuts: [StatutEnum.REALISE],
    });
    await createFiche({
      axes: [sousAxeGymnases],
      statuts: [StatutEnum.REALISE, StatutEnum.ABANDONNE],
    });
    const ficheAvecSousAction = await createFiche({
      axes: [axeMobilite],
      statuts: [StatutEnum.EN_COURS],
      jauge: 60,
    });
    // sans axe propre : rattachée au plan par son action parente (lot 2a)
    await createFiche({
      titre: 'Sous-action sans axe',
      parentId: ficheAvecSousAction,
      statuts: [StatutEnum.REALISE],
    });
    await createFiche({
      axes: [axeMobilite],
      statuts: [StatutEnum.A_VENIR],
    });

    const slides = await generateReportSlidesText(caller, {
      collectiviteId,
      planId: plan.id,
    });
    const avancementDuSlide = (marqueur: string) =>
      slides
        .filter((texte) => texte.includes(marqueur))
        .map((texte) =>
          texte.match(/Taux d’actions terminées :\s*([\d.]+)\s*%/)
        )
        .find(Boolean)?.[1];

    expect(avancementDuSlide('Synthèse du plan')).toBe('50');
    expect(avancementDuSlide('Axe Bâtiments')).toBe('70');
    expect(avancementDuSlide('Axe Mobilité')).toBe('53.3');

    // la sous-action figure dans le rapport, sans créer d'axe « sans axe »
    expect(slides.some((texte) => texte.includes('Sous-action sans axe'))).toBe(
      true
    );
    expect(slides.some((texte) => texte.includes('Actions sans axe'))).toBe(
      false
    );
  }, 90000);

  it("Liste les sous-actions dans une slide de leur action, sans slide d'action à elles, y compris quand on choisit les actions", async () => {
    const db = await getTestDatabase(app);
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const collectiviteId = collectivite.id;
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const plan = await caller.plans.plans.create({
      nom: 'Plan sous-actions',
      collectiviteId,
    });
    const { id: axeId } = await caller.plans.axes.create({
      nom: 'Axe Mobilité',
      collectiviteId,
      planId: plan.id,
      parent: plan.id,
    });
    const createFiche = async (titre: string, parentId?: number) =>
      (
        await caller.plans.fiches.create({
          fiche: { titre, collectiviteId, parentId },
        })
      ).id;

    const actionId = await createFiche('Développer le covoiturage');
    await caller.plans.fiches.update({
      ficheId: actionId,
      ficheFields: { axes: [{ id: axeId }] },
    });
    // sans axe propre : rattachées au plan par leur action parente
    const sousActionRealiseeId = await createFiche(
      'Lancer une ligne de covoiturage',
      actionId
    );
    await caller.plans.fiches.update({
      ficheId: sousActionRealiseeId,
      ficheFields: { statut: StatutEnum.REALISE },
    });
    await createFiche('Aménager une aire de covoiturage', actionId);
    const autreActionId = await createFiche('Action non choisie');
    await caller.plans.fiches.update({
      ficheId: autreActionId,
      ficheFields: { axes: [{ id: axeId }] },
    });

    const slides = await generateReportSlidesText(caller, {
      collectiviteId,
      planId: plan.id,
    });

    const sousActionsSlides = slides.filter((texte) =>
      texte.includes('Sous-actions : Développer le covoiturage')
    );
    expect(sousActionsSlides).toHaveLength(1);
    expect(sousActionsSlides[0]).toContain('Lancer une ligne de covoiturage');
    expect(sousActionsSlides[0]).toContain('Aménager une aire de covoiturage');
    expect(sousActionsSlides[0]).toContain('RÉALISÉ');
    expect(sousActionsSlides[0]).not.toContain('{{');

    expect(slides.filter((texte) => texte.includes('Action : ')).length).toBe(
      2
    );
    expect(
      slides.some((texte) => texte.includes('Action : Lancer une ligne'))
    ).toBe(false);
    expect(
      slides.some((texte) => texte.includes('2 actions - 2 sous-actions'))
    ).toBe(true);

    const slidesChoisies = await generateReportSlidesText(caller, {
      collectiviteId,
      planId: plan.id,
      ficheIds: [actionId],
    });
    expect(
      slidesChoisies.some((texte) => texte.includes('Action non choisie'))
    ).toBe(false);
    expect(
      slidesChoisies.filter(
        (texte) =>
          texte.includes('Sous-actions : Développer le covoiturage') &&
          texte.includes('Aménager une aire de covoiturage')
      )
    ).toHaveLength(1);
  }, 180000);

  async function generateReportSlidesText(
    caller: ReturnType<TrpcRouter['createCaller']>,
    {
      collectiviteId,
      planId,
      ficheIds,
    }: { collectiviteId: number; planId: number; ficheIds?: number[] }
  ): Promise<string[]> {
    const { id: reportId } = await caller.plans.reports.create({
      planId,
      templateKey: 'general_bilan_template',
      ficheIds,
    });

    await expect
      .poll(async () => (await caller.plans.reports.get({ reportId })).status, {
        interval: 2000,
        timeout: 60000,
      })
      .toBe('completed');

    const { fileId } = await caller.plans.reports.get({ reportId });
    if (fileId === null) {
      throw new Error('A completed report must carry a fileId');
    }
    const { signedUrl } = await caller.collectivites.documents.getDownloadUrl({
      collectiviteId,
      fichierId: fileId,
    });
    const response = await fetch(signedUrl);

    const dir = mkdtempSync(path.join(tmpdir(), 'rapport-plan-'));
    writeFileSync(
      path.join(dir, 'rapport.pptx'),
      Buffer.from(await response.arrayBuffer())
    );
    const info = await new Automizer({ templateDir: dir })
      .load('rapport.pptx', 'rapport')
      .getInfo();

    return info.slidesByTemplate('rapport').map((slide) =>
      slide.elements
        .flatMap((element) => element.getText())
        .join(' ')
        // un texte remplacé est découpé en plusieurs runs
        .replace(/\s+/g, ' ')
    );
  }
});
