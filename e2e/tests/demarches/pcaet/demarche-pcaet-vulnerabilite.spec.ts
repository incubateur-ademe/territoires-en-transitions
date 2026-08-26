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
});
