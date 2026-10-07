import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { DemarchePcaetPom } from './demarche-pcaet.pom';

test.describe('Démarche PCAET - vulnérabilité du territoire', () => {
  test('la saisie est persistée, horizon par horizon', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new DemarchePcaetPom(page);

    await pom.gotoCreatePage(collectivite.data.id);
    await pom.createDemarche(collectivite.data.id);
    await pom.gotoDiagnostic();
    await pom.openVulnerabiliteTopic();

    // Le socle vient de la base : ses thématiques sont là.
    await expect(pom.vulnerabiliteRow('eau')).toBeVisible();
    await expect(pom.vulnerabiliteRow('sante')).toBeVisible();

    // Rien n'est renseigné au départ : pas de badge « non renseigné ».
    await expect(pom.vulnerabiliteNiveauCell('eau', 0)).not.toContainText(
      'renseigné'
    );

    // Chaque horizon se saisit pour lui seul : le constat actuel ne remplit
    // aucune projection.
    await pom.setVulnerabiliteNiveau('eau', 0, 'moyen');
    await pom.expectVulnerabiliteNiveau('eau', 0, 'moyen');
    // Une cellule vide porte l'invite de saisie, pas un niveau.
    await expect(pom.vulnerabiliteNiveauCell('eau', 1)).toContainText(
      '+ niveau'
    );
    await expect(pom.vulnerabiliteNiveauCell('eau', 2)).toContainText(
      '+ niveau'
    );

    await pom.setVulnerabiliteNiveau('eau', 2, 'fort');
    await pom.expectVulnerabiliteNiveau('eau', 0, 'moyen');
    await pom.expectVulnerabiliteNiveau('eau', 2, 'fort');

    // La saisie est en base, plus en sessionStorage : elle survit au rechargement.
    await page.reload();
    await pom.openVulnerabiliteTopic();
    await pom.expectVulnerabiliteNiveau('eau', 0, 'moyen');
    await pom.expectVulnerabiliteNiveau('eau', 2, 'fort');
  });

  test('la collectivité ajoute une thématique, le socle reste intouchable', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new DemarchePcaetPom(page);

    await pom.gotoCreatePage(collectivite.data.id);
    await pom.createDemarche(collectivite.data.id);
    await pom.gotoDiagnostic();
    await pom.openVulnerabiliteTopic();

    // Une thématique du socle ne porte pas de corbeille : « non concerné » est la
    // seule façon de le sortir de ce qui est exigé. Le nom accessible du bouton
    // porte le libellé de la thématique, il faut donc le cibler nommément — sinon
    // l'assertion passerait à vide.
    await expect(
      pom.vulnerabiliteRow('eau').getByRole('button', {
        name: 'Supprimer la thématique Eau',
      })
    ).toHaveCount(0);

    await pom.addVulnerabiliteThematique('Zones humides');
    // Le libellé de la thématique est repris dans les noms accessibles de toute la
    // ligne : on vise le texte, seul porté par la case de la thématique.
    await expect(page.getByText('Zones humides', { exact: true })).toBeVisible();

    // La corbeille se range dans la case de la thématique : elle est atteignable
    // sans défilement horizontal.
    await expect(
      page.getByRole('button', { name: 'Supprimer la thématique Zones humides' })
    ).toBeVisible();
  });

  test('la thématique risques naturels porte ses huit sous-thématiques', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new DemarchePcaetPom(page);

    await pom.gotoCreatePage(collectivite.data.id);
    await pom.createDemarche(collectivite.data.id);
    await pom.gotoDiagnostic();
    await pom.openVulnerabiliteTopic();

    await expect(pom.vulnerabiliteRow('risques_naturels')).toBeVisible();
    await expect(pom.vulnerabiliteRow('risque_secheresse')).toBeVisible();
    await expect(pom.vulnerabiliteRow('risque_cyclones')).toBeVisible();

    // La parente est saisissable comme les autres : sa ligne n'est pas un
    // simple en-tête de groupe.
    await pom.setVulnerabiliteNiveau('risques_naturels', 0, 'fort');
    await pom.expectVulnerabiliteNiveau('risques_naturels', 0, 'fort');

    // Rien ne contraint l'enfant à s'accorder avec sa parente.
    await pom.setVulnerabiliteNiveau('risque_secheresse', 0, 'faible');
    await pom.expectVulnerabiliteNiveau('risque_secheresse', 0, 'faible');
    await pom.expectVulnerabiliteNiveau('risques_naturels', 0, 'fort');

    // Une thématique réglementaire n'accueille pas de sous-thématique.
    await expect(
      pom.vulnerabiliteAjouterSousThematiqueButton('Risques naturels')
    ).toHaveCount(0);
  });

  test('la grappe se replie et se déplie, sans perdre la saisie', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new DemarchePcaetPom(page);

    await pom.gotoCreatePage(collectivite.data.id);
    await pom.createDemarche(collectivite.data.id);
    await pom.gotoDiagnostic();
    await pom.openVulnerabiliteTopic();

    await pom.setVulnerabiliteNiveau('risque_secheresse', 0, 'faible');

    // Une thématique sans sous-thématique n'a rien à replier.
    await expect(pom.vulnerabiliteReplierButton('eau')).toHaveCount(0);

    const chevron = pom.vulnerabiliteReplierButton('risques_naturels');
    await expect(chevron).toHaveAttribute('aria-expanded', 'true');

    await chevron.click();
    await expect(chevron).toHaveAttribute('aria-expanded', 'false');
    await expect(pom.vulnerabiliteRow('risque_secheresse')).toHaveCount(0);
    await expect(pom.vulnerabiliteRow('risque_cyclones')).toHaveCount(0);
    // La parente reste, et reste saisissable.
    await expect(pom.vulnerabiliteRow('risques_naturels')).toBeVisible();

    await chevron.click();
    await expect(chevron).toHaveAttribute('aria-expanded', 'true');
    // Replier n'est qu'un confort d'affichage : la saisie est intacte.
    await pom.expectVulnerabiliteNiveau('risque_secheresse', 0, 'faible');
  });

  test('le champ de la modale garde le focus, la cellule ne passe pas en édition', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new DemarchePcaetPom(page);

    await pom.gotoCreatePage(collectivite.data.id);
    await pom.createDemarche(collectivite.data.id);
    await pom.gotoDiagnostic();
    await pom.openVulnerabiliteTopic();
    await pom.addVulnerabiliteThematique('Zones humides');

    await pom
      .vulnerabiliteAjouterSousThematiqueButton('Zones humides')
      .click();

    // Le clic sur « + » ne doit pas ouvrir en plus l'édition du libellé de la
    // cellule : son champ volait le focus dès la première frappe.
    const champ = page.getByPlaceholder('Nom de la sous-thématique');
    await champ.pressSequentially('Tourbières');
    await expect(champ).toBeFocused();
    await expect(champ).toHaveValue('Tourbières');
    await expect(
      page.getByPlaceholder('Nom de la thématique')
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'Valider' }).click();
    await expect(page.getByText('Tourbières', { exact: true })).toBeVisible();
  });

  test('une thématique ajoutée accueille des sous-thématiques, sur un seul niveau', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new DemarchePcaetPom(page);

    await pom.gotoCreatePage(collectivite.data.id);
    await pom.createDemarche(collectivite.data.id);
    await pom.gotoDiagnostic();
    await pom.openVulnerabiliteTopic();

    await pom.addVulnerabiliteThematique('Zones humides');
    await pom.addVulnerabiliteSousThematique('Zones humides', 'Tourbières');

    await expect(page.getByText('Tourbières', { exact: true })).toBeVisible();

    // La hiérarchie s'arrête là : une sous-thématique n'en porte pas à son tour.
    await expect(
      pom.vulnerabiliteAjouterSousThematiqueButton('Tourbières')
    ).toHaveCount(0);

    // La saisie de la sous-thématique tient, et survit au rechargement.
    const tourbieresRow = page
      .locator('[data-test^="demarches.pcaet.vulnerabilite.row-"]')
      .filter({ hasText: 'Tourbières' });
    await tourbieresRow.locator('td').nth(1).click();
    await page.locator('[data-test="moyen"]').click();
    await expect(tourbieresRow.locator('td').nth(1)).toContainText('moyen', {
      ignoreCase: true,
    });

    await page.reload();
    await pom.openVulnerabiliteTopic();
    await expect(
      page
        .locator('[data-test^="demarches.pcaet.vulnerabilite.row-"]')
        .filter({ hasText: 'Tourbières' })
        .locator('td')
        .nth(1)
    ).toContainText('moyen', { ignoreCase: true });
  });
});
