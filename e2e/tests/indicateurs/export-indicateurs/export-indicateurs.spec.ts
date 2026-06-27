import { expect } from '@playwright/test';
import { testWithIndicateurs as test } from '../indicateurs.fixture';
import { ExportIndicateursPom } from './export-indicateurs.pom';

/** Strictement supérieur à une page de liste (9 par défaut) */
const NB_INDICATEURS = 12;

test.describe('Export indicateurs en Excel', () => {
  let collectiviteId: number;
  let indicateurIds: number[];
  let pom: ExportIndicateursPom;

  test.beforeEach(async ({ page, collectivites, indicateurs }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    collectiviteId = collectivite.data.id;
    pom = new ExportIndicateursPom(page);

    indicateurIds = [];
    for (let i = 0; i < NB_INDICATEURS; i++) {
      indicateurIds.push(
        await indicateurs.create(user, {
          collectiviteId,
          titre: `Indicateur export e2e ${i}`,
          unite: 'unité',
        })
      );
    }
  });

  test("exporte tous les indicateurs filtrés (mode all, au-delà d'une page)", async () => {
    await pom.gotoPersoList(collectiviteId);
    const wb = await pom.exportAll();

    // Format consolidé : 1 onglet unique, 1 ligne d'en-tête + 1 ligne par indicateur
    expect(wb.worksheets.length).toBe(1);
    expect(wb.getWorksheet(1)!.rowCount).toBe(NB_INDICATEURS + 1);
  });

  test('exporte un indicateur unique depuis le détail (mode selection)', async () => {
    await pom.gotoDetail(collectiviteId, indicateurIds[0]);
    const wb = await pom.exportSingle();

    // Format consolidé : 1 onglet, 1 ligne d'en-tête + 1 ligne de données
    expect(wb.worksheets.length).toBe(1);
    expect(wb.getWorksheet(1)!.rowCount).toBe(2);
  });
});
