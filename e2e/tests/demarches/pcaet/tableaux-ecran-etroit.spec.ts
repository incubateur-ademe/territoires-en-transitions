import { expect, Page } from '@playwright/test';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '@tet/backend/demarches/pcaet/shared/models/pcaet-demande-avis.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import { InstructionPom } from './instruction.pom';

test.use({ viewport: { width: 900, height: 900 } });

/**
 * Sur un écran étroit, les colonnes de texte libre tombaient à zéro et leurs
 * en-têtes se dessinaient par-dessus les voisines : le tableau doit garder des
 * colonnes lisibles et défiler dans son cadre.
 */
const mesurerTableau = async (page: Page) => {
  const table = page.locator('table');
  await table.waitFor();

  return table.evaluate((tableElement) => {
    const scrollContainer = (() => {
      for (
        let element = tableElement.parentElement;
        element;
        element = element.parentElement
      ) {
        if (getComputedStyle(element).overflowX === 'auto') return element;
      }
      return null;
    })();
    const enTetes = [...tableElement.querySelectorAll('thead th')].map(
      (th) => ({
        libelle: th.textContent ?? '',
        rect: th.getBoundingClientRect(),
        deborde: th.scrollWidth > th.clientWidth,
      })
    );
    return {
      defile: scrollContainer
        ? scrollContainer.scrollWidth > scrollContainer.clientWidth
        : false,
      enTetesQuiDebordent: enTetes
        .filter((enTete) => enTete.deborde)
        .map((enTete) => enTete.libelle),
      enTetesQuiSeChevauchent: enTetes
        .filter(
          (enTete, index) =>
            index + 1 < enTetes.length &&
            enTete.rect.right > enTetes[index + 1].rect.left + 1
        )
        .map((enTete) => enTete.libelle),
    };
  });
};

const TABLEAU_DEFILANT_LISIBLE = {
  defile: true,
  enTetesQuiDebordent: [],
  enTetesQuiSeChevauchent: [],
};

test.describe('Démarche PCAET - tableaux sur écran étroit', () => {
  test('la liste d’instruction défile sans que les colonnes se chevauchent', async ({
    collectivites,
    page,
  }) => {
    const REGION = await pickFreeRegionCode(databaseService, 'dreal');
    const { collectivite: dreal } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL e2e écran étroit',
      },
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });
    const deposante = await collectivites.addCollectivite({
      regionCode: REGION,
      nom: 'Communauté de communes e2e au nom un peu long',
    });

    const [demarche] = await databaseService.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.data.id,
        type: 'pcaet',
        titre: 'PCAET e2e écran étroit',
        status: 'transmis_pour_avis',
        launchedAt: new Date('2026-01-15').toISOString(),
        transmittedAt: new Date().toISOString(),
      })
      .returning({ id: demarcheTable.id });
    await databaseService.db.insert(pcaetDemandeAvisTable).values({
      demarcheId: demarche.id,
      instructeurCollectiviteId: dreal.data.id,
      source: 'seed',
    });

    await new InstructionPom(page).goToDemandesAvis(dreal.data.id);

    expect(await mesurerTableau(page)).toEqual(TABLEAU_DEFILANT_LISIBLE);
  });

  test('la liste des démarches de la collectivité défile sans que les colonnes se chevauchent', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
    });
    await databaseService.db.insert(demarcheTable).values({
      collectiviteId: collectivite.data.id,
      type: 'pcaet',
      titre: 'PCAET réglementaire e2e écran étroit',
      status: 'en_elaboration',
      launchedAt: new Date('2026-01-15').toISOString(),
    });

    await page.goto(`/collectivite/${collectivite.data.id}/demarche-pcaet`);

    expect(await mesurerTableau(page)).toEqual(TABLEAU_DEFILANT_LISIBLE);
  });
});

test.describe('Démarche PCAET - tableaux sur grand écran', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  /**
   * Le cas le plus large : un service national affiche en plus la colonne
   * Région. Dès `xl`, le tableau tient dans son cadre sans défiler, ce qui
   * garde l'en-tête collant à la page.
   */
  test('la liste nationale tient dans son cadre sans défiler', async ({
    collectivites,
    page,
  }) => {
    const { collectivite: serviceNational } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: {
          type: 'service_national',
          nom: 'Service national e2e grand écran',
        },
        userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
      });

    await new InstructionPom(page).goToDemandesAvis(serviceNational.data.id);

    const table = page.locator('table');
    await expect(table).toBeVisible();
    const mesures = await table.evaluate((tableElement) => ({
      tableRight: tableElement.getBoundingClientRect().right,
      sectionRight:
        tableElement.closest('section')?.getBoundingClientRect().right ?? 0,
      overflowX: getComputedStyle(tableElement.parentElement as Element)
        .overflowX,
    }));

    expect(mesures.overflowX).toBe('visible');
    expect(mesures.tableRight).toBeLessThanOrEqual(mesures.sectionRight);
  });
});
