import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { ActionsLieesFichePom } from './actions-liees.pom';

test.describe('Volet « Lier une action » d’une fiche', () => {
  test('lie et dissocie une action par l’icône de la carte, sans case à cocher', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });
    const titreAutreFiche = 'Fiche à lier depuis le volet';
    const [ficheId] = await fiches.create(adminUser, [
      { titre: 'Fiche courante', collectiviteId: collectivite.data.id },
      { titre: titreAutreFiche, collectiviteId: collectivite.data.id },
    ]);

    const pom = new ActionsLieesFichePom(page);
    await pom.goto(collectivite.data.id, ficheId);
    await pom.openPanel();

    await expect(pom.panelCard(titreAutreFiche)).toBeVisible();
    await expect(
      pom.panelCard(titreAutreFiche).getByRole('checkbox')
    ).toHaveCount(0);

    await pom.hoverCard(titreAutreFiche);
    await pom.lierButton(titreAutreFiche).click();

    await pom.hoverCard(titreAutreFiche);
    await expect(pom.dissocierButton(titreAutreFiche)).toBeVisible();
    await expect(pom.lierButton(titreAutreFiche)).toHaveCount(0);

    await page.reload();
    await pom.openPanel();
    await pom.hoverCard(titreAutreFiche);
    await expect(pom.dissocierButton(titreAutreFiche)).toBeVisible();

    await pom.dissocierButton(titreAutreFiche).click();

    await pom.hoverCard(titreAutreFiche);
    await expect(pom.lierButton(titreAutreFiche)).toBeVisible();
    await expect(pom.dissocierButton(titreAutreFiche)).toHaveCount(0);
  });

  test('lie et dissocie aussi par un clic sur le corps de la carte, seul geste possible au toucher', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });
    const titreAutreFiche = 'Fiche à lier par clic sur la carte';
    const [ficheId] = await fiches.create(adminUser, [
      { titre: 'Fiche courante', collectiviteId: collectivite.data.id },
      { titre: titreAutreFiche, collectiviteId: collectivite.data.id },
    ]);

    const pom = new ActionsLieesFichePom(page);
    await pom.goto(collectivite.data.id, ficheId);
    await pom.openPanel();

    await pom.panelCard(titreAutreFiche).click();
    await pom.hoverCard(titreAutreFiche);
    await expect(pom.dissocierButton(titreAutreFiche)).toBeVisible();

    await pom.panelCard(titreAutreFiche).click();
    await pom.hoverCard(titreAutreFiche);
    await expect(pom.lierButton(titreAutreFiche)).toBeVisible();
  });
});
