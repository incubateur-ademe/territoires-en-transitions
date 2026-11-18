import { expect, Page } from '@playwright/test';
import { DEMARCHE_PCAET_EXPORTS_BUCKET } from '@tet/backend/demarches/pcaet/generate-exports/demarche-pcaet-exports-storage.service';
import { demarchePcaetExportTable } from '@tet/backend/demarches/pcaet/shared/models/demarche-pcaet-export.table';
import { DemarchePcaetStatus } from '@tet/domain/demarches';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import { uploadStorageObject } from 'tests/shared/storage-upload.utils';
import { DemarchePcaetPom } from './demarche-pcaet.pom';
import {
  attachPlanToDemarche,
  createDemarcheTransmise,
  createDossierSaisi,
} from './demarche-pcaet.utils';
import { InstructionPom } from './instruction.pom';

const PLAN_BUTTON = 'demarches.pcaet.exports.download-plan-button';
const INDICATEURS_BUTTON =
  'demarches.pcaet.exports.download-indicateurs-button';

/**
 * Un dépôt soumis, avec un plan rattaché de quoi remplir le classeur plan ; le
 * diagnostic reste vide.
 */
const createDepotSoumis = async ({
  collectiviteId,
  status,
}: {
  collectiviteId: number;
  status: DemarchePcaetStatus;
}) => {
  const demarcheId = await createDemarcheTransmise({
    collectiviteId,
    status,
    titre: 'PCAET soumis e2e exports',
  });
  await attachPlanToDemarche({ demarcheId, collectiviteId });
  return demarcheId;
};

type ExportTransition = 'transmettre_pour_avis' | 'publier';

const exportStoragePath = (
  demarcheId: number,
  transition: ExportTransition,
  type: 'plan' | 'indicateurs'
) => `${demarcheId}/${transition}/${type}.xlsx`;

/**
 * Les lignes d'un export figé, plan et données. Elles suffisent à ce que le
 * bouton annonce la version figée ; le téléchargement, lui, demande aussi
 * l'objet dans le stockage (cf. `storeExportFile`).
 */
const addExports = async (
  demarcheId: number,
  { transition, createdAt }: { transition: ExportTransition; createdAt: string }
) => {
  await databaseService.db.insert(demarchePcaetExportTable).values(
    (['plan', 'indicateurs'] as const).map((type) => ({
      demarcheId,
      transition,
      type,
      storagePath: exportStoragePath(demarcheId, transition, type),
      filename: `PCAET_e2e_${type}.xlsx`,
      createdAt,
    }))
  );
};

/**
 * Dépose un fichier à l'emplacement d'un export figé, pour que l'URL signée
 * serve quelque chose. Le contenu importe peu : seul le téléchargement est
 * éprouvé.
 */
const storeExportFile = (storagePath: string) =>
  uploadStorageObject({
    bucketId: DEMARCHE_PCAET_EXPORTS_BUCKET,
    path: storagePath,
    content: Buffer.from('classeur e2e'),
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

/** Attend la réponse de `exports.list` : sans elle, un bouton absent ne prouve rien. */
const waitForExportsList = (page: Page) =>
  page.waitForResponse((response) =>
    response.url().includes('demarches.pcaet.exports.list')
  );

/** Une étape côté collectivité, une fois la liste des classeurs reçue. */
const gotoEtape = async (
  page: Page,
  args: Parameters<DemarchePcaetPom['gotoEtape']>[0]
) => {
  const exportsList = waitForExportsList(page);
  await new DemarchePcaetPom(page).gotoEtape(args);
  await exportsList;
};

/** Une étape du dossier côté service, une fois la liste des classeurs reçue. */
const gotoEtapeDossier = async (
  page: Page,
  args: Parameters<InstructionPom['gotoDossier']>[0]
) => {
  const exportsList = waitForExportsList(page);
  await new InstructionPom(page).gotoDossier(args);
  await exportsList;
};

test.describe('Démarche PCAET - téléchargement des classeurs', () => {
  test('en élaboration, aucune étape ne propose de classeur', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new DemarchePcaetPom(page);

    const exportsList = waitForExportsList(page);
    await pom.gotoCreatePage(collectivite.data.id);
    await pom.createDemarche(collectivite.data.id);
    await exportsList;
    await expect(page.getByTestId(INDICATEURS_BUTTON)).toBeHidden();

    // La liste est déjà en cache : sans attendre que la section soit rendue (le
    // bouton d'import partage le conteneur d'actions), l'absence ne prouverait
    // rien.
    await pom.expectCreatePlanCta();
    await expect(page.getByTestId(PLAN_BUTTON)).toBeHidden();
  });

  test('un dépôt soumis sans export figé sert l’export du jour du plan', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarcheId = await createDepotSoumis({
      collectiviteId: collectivite.data.id,
      status: 'transmis_pour_avis',
    });

    await gotoEtape(page, {
      collectiviteId: collectivite.data.id,
      demarcheId,
      etape: 'plan',
    });
    const planButton = page.getByTestId(PLAN_BUTTON);
    await expect(planButton).toBeVisible();
    await expect(page.getByText('Données à ce jour')).toBeVisible();

    const downloadEvent = page.waitForEvent('download');
    await planButton.click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toMatch(
      /^PCAET_.+_Plan_\d{4}-\d{2}-\d{2}\.xlsx$/
    );
    expect(await download.failure()).toBeNull();

    // Diagnostic vide : rien à télécharger.
    await gotoEtape(page, {
      collectiviteId: collectivite.data.id,
      demarcheId,
      etape: 'indicateurs',
    });
    await expect(page.getByTestId(INDICATEURS_BUTTON)).toBeHidden();
  });

  // Après les avis, le contenu se rouvre : l'étape plan quitte le rappel pour
  // l'écran de rattachement, commun à toutes les démarches. Le bouton doit y
  // rester, avec la version transmise.
  test('après les avis, le contenu rouvert garde la version transmise', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarcheId = await createDepotSoumis({
      collectiviteId: collectivite.data.id,
      status: 'instruit',
    });
    await addExports(demarcheId, {
      transition: 'transmettre_pour_avis',
      createdAt: '2026-03-12T10:00:00.000Z',
    });
    const removePlanFile = await storeExportFile(
      exportStoragePath(demarcheId, 'transmettre_pour_avis', 'plan')
    );

    try {
      await gotoEtape(page, {
        collectiviteId: collectivite.data.id,
        demarcheId,
        etape: 'plan',
      });
      const planButton = page.getByTestId(PLAN_BUTTON);
      await expect(planButton).toBeVisible();
      await expect(
        page.getByText('Version transmise le 12/03/2026')
      ).toBeVisible();

      // L'export figé est servi par URL signée, sous le nom de sa ligne de
      // suivi.
      const downloadEvent = page.waitForEvent('download');
      await planButton.click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toBe('PCAET_e2e_plan.xlsx');
      expect(await download.failure()).toBeNull();
    } finally {
      await removePlanFile();
    }

    await gotoEtape(page, {
      collectiviteId: collectivite.data.id,
      demarcheId,
      etape: 'indicateurs',
    });
    await expect(page.getByTestId(INDICATEURS_BUTTON)).toBeVisible();
    await expect(
      page.getByText('Version transmise le 12/03/2026')
    ).toBeVisible();
  });

  test('une fois publié, les étapes annoncent la version publiée', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarcheId = await createDepotSoumis({
      collectiviteId: collectivite.data.id,
      status: 'publie',
    });
    // L'export figé de la publication prime sur celui, plus ancien, de la
    // transmission.
    await addExports(demarcheId, {
      transition: 'transmettre_pour_avis',
      createdAt: '2026-03-12T10:00:00.000Z',
    });
    await addExports(demarcheId, {
      transition: 'publier',
      createdAt: '2026-06-20T10:00:00.000Z',
    });

    await gotoEtape(page, {
      collectiviteId: collectivite.data.id,
      demarcheId,
      etape: 'plan',
    });
    await expect(page.getByTestId(PLAN_BUTTON)).toBeVisible();
    await expect(page.getByText('Version publiée le 20/06/2026')).toBeVisible();
  });

  test('le service saisi télécharge le plan depuis l’étape du dossier', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { deposanteId, demarcheId, demandeAvisId } = await createDossierSaisi(
      collectivites,
      { nom: 'e2e exports' }
    );
    // Sans export figé, l'export du jour n'est proposé que s'il a de quoi se
    // remplir.
    await attachPlanToDemarche({ demarcheId, collectiviteId: deposanteId });

    await gotoEtapeDossier(page, {
      collectiviteInstruiteId: deposanteId,
      demandeAvisId,
      etape: 'plan',
    });

    const planButton = page.getByTestId(PLAN_BUTTON);
    await expect(planButton).toBeVisible();
    const downloadEvent = page.waitForEvent('download');
    await planButton.click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toMatch(
      /^PCAET_.+_Plan_\d{4}-\d{2}-\d{2}\.xlsx$/
    );
    expect(await download.failure()).toBeNull();
  });

  test('le service saisi voit le classeur des données à l’étape diagnostic', async ({
    collectivites,
    page,
  }) => {
    const { deposanteId, demarcheId, demandeAvisId } = await createDossierSaisi(
      collectivites,
      { nom: 'e2e exports diagnostic' }
    );
    // Avec un export figé, le classeur des données est proposé même si le
    // diagnostic n'a pas de valeur : c'est la version transmise qui est servie.
    await addExports(demarcheId, {
      transition: 'transmettre_pour_avis',
      createdAt: '2026-03-12T10:00:00.000Z',
    });

    await gotoEtapeDossier(page, {
      collectiviteInstruiteId: deposanteId,
      demandeAvisId,
      etape: 'diagnostic',
    });

    await expect(page.getByTestId(INDICATEURS_BUTTON)).toBeVisible();
    await expect(
      page.getByText('Version transmise le 12/03/2026')
    ).toBeVisible();
    // L'étape diagnostic ne propose pas le classeur du plan.
    await expect(page.getByTestId(PLAN_BUTTON)).toBeHidden();
  });
});
