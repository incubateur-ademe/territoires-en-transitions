import { expect } from '@playwright/test';
import { UserFixture } from 'tests/users/users.fixture';
import { testWithIndicateurs as test } from '../indicateurs.fixture';
import { ExportIndicateursPom } from './export-indicateurs.pom';

/** Strictement supérieur à une page de liste (9 par défaut) */
const NB_INDICATEURS = 12;

/** Terme présent dans les titres des indicateurs à exporter, mais absent du
 * titre de l'indicateur hors périmètre (voir `HORS_PERIMETRE_TITRE`). */
const FILTRE_TEXTE = 'export e2e';
const HORS_PERIMETRE_TITRE = 'Indicateur hors périmètre';

test.describe('Export indicateurs en Excel', () => {
  let collectiviteId: number;
  let indicateurIds: number[];
  let user: UserFixture;
  let pom: ExportIndicateursPom;

  test.beforeEach(async ({ page, collectivites, indicateurs }) => {
    const created = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    collectiviteId = created.collectivite.data.id;
    user = created.user;
    pom = new ExportIndicateursPom(page);

    // Indicateurs sans parent : un onglet par indicateur dans l'export
    indicateurIds = [];
    for (let i = 0; i < NB_INDICATEURS; i++) {
      indicateurIds.push(
        await indicateurs.create(user, {
          collectiviteId,
          titre: `Indicateur ${FILTRE_TEXTE} ${i}`,
          unite: 'unité',
        })
      );
    }
  });

  test("exporte tous les indicateurs filtrés (mode all, au-delà d'une page)", async ({
    indicateurs,
  }) => {
    // Indicateur volontairement hors du périmètre du filtre appliqué ensuite :
    // il ne doit pas figurer dans l'export si `filters` est bien pris en compte.
    await indicateurs.create(user, {
      collectiviteId,
      titre: HORS_PERIMETRE_TITRE,
      unite: 'unité',
    });

    await pom.gotoPersoList(collectiviteId);
    await pom.filterByText(FILTRE_TEXTE, NB_INDICATEURS);
    const wb = await pom.exportAll();

    // Un onglet par indicateur (indicateurs perso sans parent)
    expect(wb.worksheets.length).toBe(NB_INDICATEURS);
  });

  test('exporte un indicateur unique depuis le détail (mode selection)', async () => {
    await pom.gotoDetail(collectiviteId, indicateurIds[0]);
    const wb = await pom.exportSingle();

    expect(wb.worksheets.length).toBe(1);
  });
});
