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
    }: {
      axes?: number[];
      statuts: Statut[];
      jauge?: number;
      parentId?: number;
    }) => {
      const { id } = await caller.plans.fiches.create({
        fiche: { titre: 'Action', collectiviteId, parentId },
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
    await createFiche({
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
        .map((texte) => texte.match(/Taux d’actions terminées :\s*([\d.]+)%/))
        .find(Boolean)?.[1];

    expect(avancementDuSlide('Synthèse du plan')).toBe('50');
    expect(avancementDuSlide('Axe Bâtiments')).toBe('70');
    expect(avancementDuSlide('Axe Mobilité')).toBe('53.3');
  }, 90000);

  async function generateReportSlidesText(
    caller: ReturnType<TrpcRouter['createCaller']>,
    { collectiviteId, planId }: { collectiviteId: number; planId: number }
  ): Promise<string[]> {
    const { id: reportId } = await caller.plans.reports.create({
      planId,
      templateKey: 'general_bilan_template',
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

    return info
      .slidesByTemplate('rapport')
      .map((slide) =>
        slide.elements.flatMap((element) => element.getText()).join(' ')
      );
  }
});
