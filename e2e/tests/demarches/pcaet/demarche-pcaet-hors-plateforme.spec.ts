import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { DemarchePcaetPom } from './demarche-pcaet.pom';

/**
 * Le dépôt d'un PCAET déjà transmis pour avis hors de la plateforme : la
 * collectivité saute l'élaboration et la transmission, et atterrit d'emblée à
 * l'étape de finalisation — sans être dispensée d'y saisir son dossier.
 */
test.describe('Démarche PCAET - dépôt hors plateforme', () => {
  test('la démarche démarre à la finalisation, tout restant à saisir', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id, {
      horsPlateforme: true,
    });

    // L'acte qui clôt le parcours est la publication, et non la transmission :
    // le circuit d'avis ne s'ouvrira jamais pour ce dossier.
    await expect(demarchePcaetPom.stepsNavTransmettre).toBeHidden();

    // Le rattachement du plan reste à faire : sauter l'élaboration n'enlève
    // rien aux pièces du dossier.
    await demarchePcaetPom.expectCreatePlanCta();
  });

  test('les pièces des deux temps tiennent dans une seule liste', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id, {
      horsPlateforme: true,
    });
    await demarchePcaetPom.gotoDocuments();

    // Une seule liste : le dossier n'a jamais été figé, rien ne justifie d'y
    // lire une coupure entre l'avant et l'après-avis.
    await expect(demarchePcaetPom.documentsTable('fusionnee')).toBeVisible();
    await expect(demarchePcaetPom.documentsTable('amont')).toBeHidden();
    await expect(demarchePcaetPom.documentsTable('aval')).toBeHidden();

    // Elle porte bien les deux temps, l'élaboration d'abord.
    const lignes = demarchePcaetPom
      .documentsTable('fusionnee')
      .getByRole('row');
    const textes = await lignes.allInnerTexts();
    const rangDiagnostic = textes.findIndex((t) => t.includes('Diagnostic'));
    const rangDeliberation = textes.findIndex((t) =>
      t.includes('adoption du PCAET')
    );
    expect(rangDiagnostic).toBeGreaterThanOrEqual(0);
    expect(rangDeliberation).toBeGreaterThan(rangDiagnostic);
  });
});
