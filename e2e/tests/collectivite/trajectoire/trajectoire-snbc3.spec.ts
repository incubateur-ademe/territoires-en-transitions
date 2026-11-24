import { expect } from '@playwright/test';
import { getTrajectoireLeviersDataResponseSample } from '@tet/backend/indicateurs/trajectoire-leviers/samples/get-trajectoire-leviers-data.response-sample';
import { readFile } from 'node:fs/promises';
import { testWithTrajectoiresSnbc3 as test } from './trajectoire-snbc3.fixture';
import { TrajectoireSnbc3Pom } from './trajectoire-snbc3.pom';

/** Index du secteur « Déchets » dans le sélecteur des émissions GES (0 = tous). */
const SECTEUR_DECHETS_IDX = 6;

const ANNEES = [2021, 2030, 2050];
const valeursSecteurs = (identifiants: string[]) =>
  identifiants.flatMap((identifiant, i) =>
    ANNEES.map((annee, j) => ({
      identifiant,
      annee,
      objectif: (i + 1) * 100 - j * 20,
    }))
  );

// En CI, le flag `is-trajectoire-snbc3-enabled` est toujours actif : la page
// testée est la nouvelle page SNBC 3.
test.describe('Trajectoire SNBC 3', () => {
  test('le Mondrian garde les textes lisibles, ses repères et sa légende dans le PNG', async ({
    collectivites,
    trajectoiresSnbc3,
    page,
  }, testInfo) => {
    const tinyLevier = 'Levier dont la surface est inférieure à un pixel';
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { type: 'epci', natureInsee: 'CA' },
      userArgs: { autoLogin: true },
    });
    await trajectoiresSnbc3.addValeurs(
      collectivite.data.id,
      valeursSecteurs(['cae_1.c'])
    );
    await page.addInitScript(() =>
      sessionStorage.setItem('oidc-modal-seen', '1')
    );
    // Seule la réponse des leviers est fixée pour reproduire les surfaces
    // extrêmes. La navigation, les filtres et l'export utilisent la vraie app.
    await page.route(
      /\/trpc\/indicateurs\.trajectoires\.leviers\.getData/,
      (route) =>
        route.fulfill({
          json: {
            result: {
              data: {
                ...getTrajectoireLeviersDataResponseSample,
                secteurs: getTrajectoireLeviersDataResponseSample.secteurs.map(
                  (secteur, index) =>
                    index === 0
                      ? {
                          ...secteur,
                          leviers: [
                            ...secteur.leviers,
                            {
                              nom: tinyLevier,
                              pourcentageRegional: 0.000001,
                              objectifReduction: -0.000001,
                            },
                          ],
                        }
                      : secteur
                ),
              },
            },
          },
        })
    );

    await new TrajectoireSnbc3Pom(page).goto(collectivite.data.id);
    const chart = page.getByTestId('indicateurs.trajectoires.leviers.mondrian');
    const tiles = chart.getByTestId('indicateurs.trajectoires.leviers.tile');
    const references = chart.getByTestId(
      'indicateurs.trajectoires.leviers.repere'
    );
    const legend = chart.getByRole('group', { name: 'Repères (ktCO₂e)' });
    const entries = legend.getByTestId(
      'indicateurs.trajectoires.leviers.legend-entry'
    );
    const tinyReference = chart.getByRole('button', {
      name: new RegExp(`^Repère \\d+ : ${tinyLevier}`),
    });
    const getReferences = () =>
      entries.evaluateAll((elements) =>
        Object.fromEntries(
          elements.map((element) => [
            element.textContent,
            element.getAttribute('data-reference'),
          ])
        )
      );

    await expect(tiles).toHaveCount(25);
    await expect(legend).toContainText(tinyLevier);
    await expect(tinyReference).toHaveAccessibleName(new RegExp(tinyLevier));
    const desktopReferences = await getReferences();
    const desktopWidth = await chart.evaluate((element) => element.clientWidth);

    await page.setViewportSize({ width: 390, height: 1024 });
    await expect
      .poll(() =>
        chart
          .locator('canvas')
          .first()
          .evaluate((element) => element.clientWidth)
      )
      .toBeLessThan(desktopWidth);
    await expect(tiles).toHaveCount(25);
    await expect(tinyReference).toHaveAccessibleName(new RegExp(tinyLevier));
    const chartRight = await chart.evaluate(
      (element) => element.getBoundingClientRect().right
    );
    await expect
      .poll(() =>
        tiles.evaluateAll((elements) =>
          Math.max(
            ...elements.map((element) => element.getBoundingClientRect().right)
          )
        )
      )
      .toBeLessThanOrEqual(chartRight + 1);

    const labelMetrics = () =>
      tiles.evaluateAll((elements) =>
        elements.flatMap((tile) => {
          const bounds = tile.getBoundingClientRect();
          return ['tile-label', 'tile-value'].flatMap((kind) => {
            const text = tile.querySelector(
              `[data-test="indicateurs.trajectoires.leviers.${kind}"]`
            );
            if (!text) return [];
            const range = document.createRange();
            range.selectNodeContents(text);
            const rect = range.getBoundingClientRect();
            const style = getComputedStyle(text);
            return [
              {
                kind,
                text: text.textContent,
                size: parseFloat(style.fontSize),
                weight: style.fontWeight,
                fits:
                  rect.left >= bounds.left &&
                  rect.right <= bounds.right + 1 &&
                  rect.top >= bounds.top &&
                  rect.bottom <= bounds.bottom + 1,
              },
            ];
          });
        })
      );
    await expect
      .poll(async () => (await labelMetrics()).filter((text) => !text.fits))
      .toEqual([]);
    const metrics = await labelMetrics();
    expect(metrics.length).toBeGreaterThan(0);
    expect(
      metrics.some((text) => text.kind === 'tile-label' && text.size < 16)
    ).toBe(true);
    for (const text of metrics) {
      expect(text.size, text.text ?? '').toBeGreaterThanOrEqual(12);
      expect(text.weight).toBe(text.kind === 'tile-value' ? '400' : '600');
    }
    const narrowReferences = await getReferences();
    for (const [label, reference] of Object.entries(narrowReferences).filter(
      ([label]) => label in desktopReferences
    )) {
      expect(reference).toBe(desktopReferences[label]);
    }
    expect(
      await references.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-reference')).sort()
      )
    ).toEqual(Object.values(narrowReferences).sort());
    const overlaps = await references.evaluateAll((elements) => {
      const bounds = elements.map((element) => element.getBoundingClientRect());
      return bounds.flatMap((rect, index) =>
        bounds
          .slice(index + 1)
          .filter(
            (other) =>
              rect.left < other.right &&
              rect.right > other.left &&
              rect.top < other.bottom &&
              rect.bottom > other.top
          )
      );
    });
    expect(overlaps).toEqual([]);

    const tinyTile = tiles.and(chart.locator(`[data-levier*="${tinyLevier}"]`));
    const tinyEntry = entries.filter({ hasText: tinyLevier });
    for (const control of [tinyReference, tinyEntry]) {
      await control.focus();
      await control.hover();
      await page.mouse.move(0, 0);
      await expect(control).toBeFocused();
      await expect(tinyTile).not.toHaveCSS('box-shadow', 'none');
      await chart
        .getByRole('button', { name: 'Télécharger le graphique (PNG)' })
        .focus();
      await expect(control).not.toBeFocused();
      await expect(tinyTile).toHaveCSS('box-shadow', 'none');
    }

    await tinyReference.focus();
    await page.keyboard.press('Enter');
    await expect(tiles).toHaveCount(4);
    await expect(page).toHaveURL(/[?&]s=\d+/);
    await chart.getByText('Mondrian territorialisé', { exact: true }).click();
    await expect(tiles).toHaveCount(25);
    await expect(tinyReference).toHaveAccessibleName(new RegExp(tinyLevier));

    const chartBounds = await chart.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const legend = element.querySelector(
        '[data-test="indicateurs.trajectoires.leviers.legend"]'
      );
      if (!legend) throw new Error("La légende du Mondrian n'est pas affichée");
      return {
        width: rect.width,
        legendHeight: legend.getBoundingClientRect().height,
      };
    });
    const canvasHeight = await chart
      .locator('canvas')
      .first()
      .evaluate((canvas) => canvas.clientHeight);
    const downloadPromise = page.waitForEvent('download');
    await chart
      .getByRole('button', { name: 'Télécharger le graphique (PNG)' })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      'trajectoire-leviers-mondrian.png'
    );
    const pngPath = testInfo.outputPath('mondrian.png');
    await download.saveAs(pngPath);
    const png = await readFile(pngPath);
    const exported = await page.evaluate(
      async ({ source, legendHeight }) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Impossible de lire le PNG du Mondrian');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(
          0,
          canvas.height - Math.ceil(legendHeight * 2),
          canvas.width,
          Math.ceil(legendHeight * 2)
        ).data;
        let coloredPixels = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          if (
            pixels[index] < 240 ||
            pixels[index + 1] < 240 ||
            pixels[index + 2] < 240
          )
            coloredPixels++;
        }
        return { width: canvas.width, height: canvas.height, coloredPixels };
      },
      {
        source: `data:image/png;base64,${png.toString('base64')}`,
        legendHeight: chartBounds.legendHeight,
      }
    );
    expect(exported.width).toBe(Math.ceil(chartBounds.width) * 2);
    expect(exported.height).toBeGreaterThan(
      Math.ceil(canvasHeight + chartBounds.legendHeight) * 2
    );
    expect(exported.coloredPixels).toBeGreaterThan(100);
  });

  test('un EPCI présent dans le millésime voit sa trajectoire, sans calcul ni saisie', async ({
    collectivites,
    trajectoiresSnbc3,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { type: 'epci', natureInsee: 'CA' },
      userArgs: { autoLogin: true },
    });
    // Déchets (`cae_1.h`) volontairement absent
    await trajectoiresSnbc3.addValeurs(
      collectivite.data.id,
      valeursSecteurs(['cae_1.c', 'cae_1.d', 'cae_1.i', 'cae_1.ih', 'cae_1.k'])
    );
    const pom = new TrajectoireSnbc3Pom(page);

    await pom.goto(collectivite.data.id);

    await expect(pom.title).toBeVisible();
    await expect(pom.recalculerButton).toHaveCount(0);
    await expect(pom.completerDonneesButton).toHaveCount(0);

    // « Ce qui change » depuis le lien sous le titre
    await pom.lienChangements.click();
    await expect(pom.changementsModal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pom.changementsModal).toHaveCount(0);

    // le bandeau, une fois fermé, ne revient pas
    await expect(pom.bandeau).toBeVisible();
    await pom.fermerBandeauButton.click();
    await expect(pom.bandeau).toHaveCount(0);
    await page.reload();
    await expect(pom.title).toBeVisible();
    await expect(pom.bandeau).toHaveCount(0);

    // un secteur sans valeur : « Données non disponibles », sans bouton
    await pom.goto(collectivite.data.id, SECTEUR_DECHETS_IDX);
    await expect(pom.secteurNonDisponible).toBeVisible();
    await expect(pom.secteurNonDisponible.getByRole('button')).toHaveCount(0);
  });

  test('une commune est renvoyée vers la trajectoire de son EPCI', async ({
    collectivites,
    trajectoiresSnbc3,
    page,
  }) => {
    const epci = await collectivites.addCollectivite({
      type: 'epci',
      natureInsee: 'CA',
    });
    const { collectivite: commune } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: { type: 'commune' },
        userArgs: { autoLogin: true },
      });
    await trajectoiresSnbc3.addEpciParent(commune.data.id, epci.data.id);
    const pom = new TrajectoireSnbc3Pom(page);

    await pom.goto(commune.data.id);

    await expect(pom.communeCard).toBeVisible();
    await expect(pom.consulterRattachementText).toBeVisible();
    await expect(pom.recalculerButton).toHaveCount(0);
    await pom.voirRattachementButton.click();
    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${epci.data.id}/trajectoire$`)
    );
  });

  test("une commune sans EPCI parent n'est renvoyée vers aucune trajectoire", async ({
    collectivites,
    page,
  }) => {
    const { collectivite: commune } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: { type: 'commune' },
        userArgs: { autoLogin: true },
      });
    const pom = new TrajectoireSnbc3Pom(page);

    await pom.goto(commune.data.id);

    await expect(pom.communeCard).toBeVisible();
    await expect(pom.consulterRattachementText).toHaveCount(0);
    await expect(pom.voirRattachementButton).toHaveCount(0);
  });
});
