import { expect } from '@playwright/test';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { DropdownPom } from 'tests/shared/dropdown.pom';

test.describe('Liste des membres et mise à jour du rôle', () => {
  test('liste les membres et met à jour le rôle d’un membre', async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});

    const adminUser = await collectivite.addUser({
      autoLogin: false,
      role: CollectiviteRole.ADMIN,
    });
    const memberToUpdate = await collectivite.addUser({
      autoLogin: false,
      role: CollectiviteRole.EDITION,
    });

    await adminUser.login();
    await page.goto(`/collectivite/${collectivite.data.id}/users`);

    await expect(page.locator('[data-test="Users"]')).toBeVisible();

    const memberRow = page.locator(
      `[data-test="MembreRow-${memberToUpdate.data.email}"]`
    );
    await expect(memberRow).toBeVisible();

    const accesDropdown = new DropdownPom(
      page,
      memberRow.locator('[data-test="acces-dropdown"]')
    );
    await accesDropdown.selectOption('Lecteur');

    await expect(
      memberRow.locator('[data-test="acces-dropdown"]')
    ).toContainText('Lecteur');

    await page.reload();

    const refreshedMemberRow = page.locator(
      `[data-test="MembreRow-${memberToUpdate.data.email}"]`
    );
    await expect(
      refreshedMemberRow.locator('[data-test="acces-dropdown"]')
    ).toContainText('Lecteur');
  });

  test('un membre avec un rôle édition ne peut modifier que ses propres informations', async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});

    const editionUser = await collectivite.addUser({
      autoLogin: false,
      role: CollectiviteRole.EDITION,
    });
    const otherMember = await collectivite.addUser({
      autoLogin: false,
      role: CollectiviteRole.LECTURE,
    });

    await editionUser.login();

    await page.goto(`/collectivite/${collectivite.data.id}/users`);

    const editionRow = page.locator(
      `[data-test="MembreRow-${editionUser.data.email}"]`
    );
    const otherRow = page.locator(
      `[data-test="MembreRow-${otherMember.data.email}"]`
    );

    await expect(editionRow).toBeVisible();
    await expect(otherRow).toBeVisible();

    await expect(
      editionRow.locator('[data-test="fonction-dropdown"]')
    ).toBeVisible();
    await expect(
      editionRow.locator('[data-test="champ_intervention-dropdown"]')
    ).toBeVisible();
    await expect(
      editionRow.locator('[data-test="details_fonction-textarea"]')
    ).toBeVisible();

    await expect(editionRow.locator('[data-test="delete"]')).toBeVisible();

    await editionRow.locator('[data-test="delete"]').click();

    await expect(
      page.getByRole('dialog', {
        name: 'Retirer mon accès la collectivité',
      })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Valider' }).click();

    await expect(
      editionRow.locator('[data-test="acces-dropdown"]')
    ).toHaveCount(0);

    await expect(
      otherRow.locator('[data-test="fonction-dropdown"]')
    ).toHaveCount(0);
    await expect(
      otherRow.locator('[data-test="champ_intervention-dropdown"]')
    ).toHaveCount(0);
    await expect(
      otherRow.locator('[data-test="details_fonction-textarea"]')
    ).toHaveCount(0);
    await expect(otherRow.locator('[data-test="acces-dropdown"]')).toHaveCount(
      0
    );
    await expect(otherRow.locator('[data-test="delete"]')).toHaveCount(0);

    await expect(editionRow).toHaveCount(0);
  });

  test('ne permet pas de modifier les membres quand l’utilisateur ne fait pas partie de la collectivité', async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});

    const existingMember = await collectivite.addUser({
      autoLogin: false,
      role: CollectiviteRole.EDITION,
    });

    const anotherCollectivite = await collectivites.addCollectivite({});

    const outsideUser = await anotherCollectivite.addUser({
      role: CollectiviteRole.ADMIN,
    });
    await outsideUser.login();

    await page.goto(`/collectivite/${collectivite.data.id}/users`);

    const memberRow = page.locator(
      `[data-test="MembreRow-${existingMember.data.email}"]`
    );
    await expect(memberRow).toBeVisible();

    await expect(
      memberRow.locator('[data-test="fonction-dropdown"]')
    ).toHaveCount(0);
    await expect(
      memberRow.locator('[data-test="champ_intervention-dropdown"]')
    ).toHaveCount(0);
    await expect(
      memberRow.locator('[data-test="details_fonction-textarea"]')
    ).toHaveCount(0);
    await expect(memberRow.locator('[data-test="acces-dropdown"]')).toHaveCount(
      0
    );
    await expect(memberRow.locator('[data-test="delete"]')).toHaveCount(0);
  });
});
