import { expect, Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { UserFixture } from 'tests/users/users.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';
import { NewAuditLabellisationPom } from './new-audit-labellisation.pom';

const referentiel: ReferentielId = 'eci';

const auditBadgeTab = (page: Page, label: string | RegExp) =>
  page.getByRole('tab', { name: label });

async function viewAs(
  user: UserFixture,
  pom: NewAuditLabellisationPom,
  collectiviteId: number
): Promise<void> {
  await user.login();
  await pom.goto(collectiviteId, referentiel);
}

async function viewAsNonMember(
  user: UserFixture,
  page: Page,
  collectiviteId: number
): Promise<void> {
  await user.login();
  await page.goto(
    `/collectivite/${collectiviteId}/referentiel/new/${referentiel}/audit-labellisation`
  );
  await expect(
    page.getByRole('tab', { name: /Audit et labellisation/ })
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Badge d'état d'audit : tous les états CT vs auditeur", () => {
  let collectiviteId: number;
  let editeurUser: UserFixture;
  let auditeurUser: UserFixture;
  let nonMembreUser: UserFixture;

  test.beforeEach(async ({ collectivites, referentiels, users }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    collectiviteId = collectivite.data.id;
    editeurUser = user;
    await editeurUser.precomputeReferentielSnapshot(
      collectiviteId,
      referentiel
    );
    await referentiels.seedLabellisationObtenue({
      collectiviteId,
      referentielId: referentiel,
      etoiles: 1,
    });
    await referentiels.updateAllReferentielStatutsToFait(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.seedLabellisationPreuve(
      editeurUser,
      collectiviteId,
      referentiel
    );
    auditeurUser = await (collectivite as CollectiviteFixture).addUser({
      role: CollectiviteRole.LECTURE,
      autoLogin: true,
    });
    nonMembreUser = await users.addUser();
  });

  test('demande envoyée et auditeur attribué', async ({
    page,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await referentiels.requestLabellisationAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });

    await viewAs(editeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(auditBadgeTab(page, /Audit demandé/)).toBeVisible();
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeDisabled();

    await viewAs(auditeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(auditBadgeTab(page, /Audit attribué/)).toBeVisible();

    await viewAsNonMember(nonMembreUser, page, collectiviteId);
    await expect(auditBadgeTab(page, /Audit demandé/)).toBeVisible();
    await expect(newAuditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test('audit en cours', async ({
    page,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await referentiels.requestLabellisationAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);

    const badgeAuditEnCours = `Audit en cours par ${auditeurUser.data.prenom} ${auditeurUser.data.nom}`;

    await viewAs(editeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(auditBadgeTab(page, badgeAuditEnCours)).toBeVisible();
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeDisabled();

    await viewAs(auditeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(auditBadgeTab(page, /Audit en cours/)).toBeVisible();
    await expect(auditBadgeTab(page, badgeAuditEnCours)).toHaveCount(0);

    await viewAsNonMember(nonMembreUser, page, collectiviteId);
    await expect(auditBadgeTab(page, badgeAuditEnCours)).toBeVisible();
    await expect(newAuditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test('audit terminé pour une demande de labellisation', async ({
    page,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await referentiels.requestLabellisationAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);
    await referentiels.validateAudit(collectiviteId, referentiel);

    await viewAs(editeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(
      auditBadgeTab(page, /Audit terminé et labellisation en cours/)
    ).toBeVisible();
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeDisabled();

    await viewAs(auditeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(auditBadgeTab(page, /Audit terminé/)).toBeVisible();

    await viewAsNonMember(nonMembreUser, page, collectiviteId);
    await expect(
      auditBadgeTab(page, /Audit terminé et labellisation en cours/)
    ).toBeVisible();
    await expect(newAuditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test('audit terminé + labellisation obtenue : badge auditeur toujours visible mais plus de badge pour la CT', async ({
    page,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await referentiels.requestLabellisationAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);
    await referentiels.validateAudit(collectiviteId, referentiel);
    await referentiels.seedLabellisationObtenue({
      collectiviteId,
      referentielId: referentiel,
      etoiles: 2,
      obtenueLe: '2027-01-01T00:00:00.000Z',
    });

    await viewAs(editeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(
      auditBadgeTab(page, /Audit (demandé|attribué|en cours|terminé)/)
    ).toHaveCount(0);
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeEnabled();

    await viewAs(auditeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(auditBadgeTab(page, /Audit terminé/)).toBeVisible();

    await viewAsNonMember(nonMembreUser, page, collectiviteId);
    await expect(
      auditBadgeTab(page, /Audit (demandé|attribué|en cours|terminé)/)
    ).toHaveCount(0);
    await expect(newAuditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test('audit COT terminé : le cycle se referme et la CT peut redemander', async ({
    page,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await referentiels.requestCotAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);
    await referentiels.validateAudit(collectiviteId, referentiel);

    await viewAs(editeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeEnabled();
    await expect(auditBadgeTab(page, /Audit terminé/)).toHaveCount(0);

    await viewAs(auditeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(auditBadgeTab(page, /Audit terminé/)).toHaveCount(0);

    await viewAsNonMember(nonMembreUser, page, collectiviteId);
    await expect(auditBadgeTab(page, /Audit terminé/)).toHaveCount(0);
    await expect(newAuditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test("audit en cours : l'auditeur voit « Clôturer l'audit », la CT voit la demande", async ({
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await referentiels.requestLabellisationAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);

    await viewAs(editeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(newAuditLabellisationPom.cloturerAuditButton).toHaveCount(0);
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeDisabled();

    await viewAs(auditeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(newAuditLabellisationPom.cloturerAuditButton).toBeVisible();
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toHaveCount(0);
    await expect(newAuditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test("l'auditeur clôture l'audit en déposant un rapport et la CT voit « Audit terminé et labellisation en cours »", async ({
    page,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await referentiels.requestLabellisationAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);

    await viewAs(auditeurUser, newAuditLabellisationPom, collectiviteId);
    await newAuditLabellisationPom.closeAuditWithReport();

    await expect(auditBadgeTab(page, /Audit terminé/)).toBeVisible();

    await viewAs(editeurUser, newAuditLabellisationPom, collectiviteId);
    await expect(
      auditBadgeTab(page, /Audit terminé et labellisation en cours/)
    ).toBeVisible();
  });
});
