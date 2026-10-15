import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { FichesLieesMesurePom, MesuresLieesFichePom } from './mesures-liees.pom';

const MESURE_CAE = 'cae_1.1.1';
const AUTRE_MESURE_CAE = 'cae_1.1.2';
const MESURE_CR = 'te_1.1.1';

const COLLECTIVITE_BASCULEE = {
  cae: { display: true, mode: 'archived' },
  eci: { display: false, mode: 'archived' },
  te: { display: true, mode: 'write' },
} as const;

test.describe('Lien fiche ↔ mesure sur une collectivité basculée vers Climat Ressources', () => {
  test('depuis la fiche, seules les mesures CR sont proposées et la mesure CAE archivée liée reste retirable', async ({
    page,
    collectivites,
    fiches,
    referentiels,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });
    const [ficheId] = await fiches.create(adminUser, [
      { titre: 'Fiche liée à une mesure CAE', collectiviteId: collectivite.data.id },
    ]);
    await adminUser.getTrpcClient().plans.fiches.update.mutate({
      ficheId,
      ficheFields: { mesures: [{ id: MESURE_CAE }] },
    });

    const supportUser = await collectivite.addUser({
      isSupport: true,
      isSuperAdminRoleEnabled: true,
    });
    await referentiels.setReferentielPreferences(
      supportUser,
      collectivite.data.id,
      COLLECTIVITE_BASCULEE
    );

    const pom = new MesuresLieesFichePom(page);
    await pom.goto(collectivite.data.id, ficheId);
    await expect(pom.mesureCard(MESURE_CAE)).toBeVisible();

    await pom.openModal();
    await pom.openDropdown();

    // La mesure CAE déjà liée est proposée (pour pouvoir la retirer), pas les
    // autres mesures du référentiel archivé
    await expect(pom.option(MESURE_CAE)).toBeVisible();
    await expect(pom.option(AUTRE_MESURE_CAE)).toHaveCount(0);

    // Les mesures CR sont proposées, avec le préfixe « CR »
    await pom.search('cr 1.1.1');
    await expect(pom.option(MESURE_CR)).toHaveAttribute(
      'aria-label',
      /^CR 1\.1\.1 - /
    );
    await pom.option(MESURE_CR).click();

    // Retire le lien vers la mesure CAE archivée
    await pom.search('cae 1.1.1');
    await pom.option(MESURE_CAE).click();

    await pom.closeDropdown();
    await pom.valider();

    await expect(pom.mesureCard(MESURE_CR)).toBeVisible();
    await expect(pom.mesureCard(MESURE_CAE)).toHaveCount(0);

    await page.reload();
    await expect(pom.mesureCard(MESURE_CR)).toBeVisible();
    await expect(pom.mesureCard(MESURE_CAE)).toHaveCount(0);
  });

  test("depuis une mesure CAE archivée, les actions liées sont en consultation", async ({
    page,
    collectivites,
    fiches,
    referentiels,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });
    const titreFiche = 'Fiche liée consultable depuis la mesure';
    const [ficheId] = await fiches.create(adminUser, [
      { titre: titreFiche, collectiviteId: collectivite.data.id },
    ]);
    await adminUser.getTrpcClient().plans.fiches.update.mutate({
      ficheId,
      ficheFields: { mesures: [{ id: MESURE_CAE }] },
    });

    const supportUser = await collectivite.addUser({
      isSupport: true,
      isSuperAdminRoleEnabled: true,
    });
    await referentiels.setReferentielPreferences(
      supportUser,
      collectivite.data.id,
      COLLECTIVITE_BASCULEE
    );

    const pom = new FichesLieesMesurePom(page);

    // Mesure sans action liée : un message remplace le sélecteur
    await pom.goto(collectivite.data.id, 'cae', AUTRE_MESURE_CAE);
    await expect(pom.aucuneActionLieeMessage).toBeVisible();
    await expect(pom.fichesDropdownButton).toHaveCount(0);

    // Mesure avec une action liée : ni sélecteur ni « dissocier », mais la
    // carte reste un lien vers l'action
    await pom.goto(collectivite.data.id, 'cae', MESURE_CAE);
    const ficheCard = pom.ficheCard(titreFiche);
    await expect(ficheCard).toBeVisible();
    await expect(pom.fichesDropdownButton).toHaveCount(0);
    await expect(pom.dissocierButtons).toHaveCount(0);
    await expect(pom.aucuneActionLieeMessage).toHaveCount(0);

    await ficheCard.click();
    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${collectivite.data.id}/actions/${ficheId}`)
    );
  });
});
