import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from 'tests/referentiels/referentiels.fixture';

const referentiel: ReferentielId = 'cae';
const preuveReglementaireNom = 'Agenda 21 / Agenda 2030';

const ARCHIVE_ROUTE = '/documents/archive';
const ROUTE_NEXT_SUPPRIMEE = '/api/zip';

test.describe("Téléchargement groupé des documents d'une mesure", () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
    await page.goto('/');
  });

  test("l'archive vient du backend et porte le nom qu'il a choisi", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    const archiveRequests: string[] = [];
    const routeNextRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes(ARCHIVE_ROUTE)) {
        archiveRequests.push(`${request.method()} ${url}`);
      }
      if (url.includes(ROUTE_NEXT_SUPPRIMEE)) {
        routeNextRequests.push(url);
      }
    });

    await referentielScoresPom.goto(referentiel);
    await referentielScoresPom.goToActionPage('1.1.1');
    await referentielScoresPom.expandSousAction('1.1.1.3');
    await referentielScoresPom.uploadPreuveReglementaire(
      preuveReglementaireNom
    );
    await expect(referentielScoresPom.documentsPom.documentCard).toBeVisible();

    const downloadButton = page.getByRole('button', {
      name: 'Télécharger tous les documents',
    });
    await expect(downloadButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    expect(
      archiveRequests,
      `une seule requête vers ${ARCHIVE_ROUTE} ; observées : ${archiveRequests.join(
        ', '
      )}`
    ).toHaveLength(1);
    expect(archiveRequests[0]).toMatch(/^GET /);
    expect(
      routeNextRequests,
      `la route Next ${ROUTE_NEXT_SUPPRIMEE} ne doit plus être appelée`
    ).toHaveLength(0);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.zip$/);
    expect(
      filename,
      "le nom vient de l'en-tête du backend, que le client ne fabrique plus"
    ).toContain(collectivite.data.nom);
  });

  test('le bouton reste inactif tant que la mesure ne porte aucun document', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto(referentiel);
    await referentielScoresPom.goToActionPage('1.1.1');
    await referentielScoresPom.expandSousAction('1.1.1.3');
    await referentielScoresPom.documentsExpandButton.click();

    await expect(
      page.getByRole('button', { name: 'Télécharger tous les documents' })
    ).toBeDisabled();
  });
});
