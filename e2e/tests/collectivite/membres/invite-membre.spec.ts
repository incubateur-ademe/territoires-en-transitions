import { Browser, expect } from '@playwright/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import {
  clearMailpitMailbox,
  getInvitationEmailFromMailpit,
  getOtpFromMailpit,
} from 'tests/shared/mailpit.utils';
import { SignupUserPom } from '../../users/users/signup-user/signup-user.pom';
import { InviteMembrePom } from './invite-membre.pom';

const generateTestEmail = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `invite-${timestamp}-${random}@test-e2e.fr`;
};

// Mot de passe suffisamment robuste pour obtenir un score zxcvbn de 4
const STRONG_PASSWORD = 'kX9#mP2$qR7!bN4@wZ';

test.describe('Invitation de membre', () => {
  test('invite un nouvel utilisateur (n’existe pas encore) : email reçu, signup, membre visible', async ({
    collectivites,
    page,
    context,
  }) => {
    test.setTimeout(60_000);

    const inviteEmail = generateTestEmail();

    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);
    await pom.inviteMembre(inviteEmail, CollectiviteRole.LECTURE);
    await pom.expectInvitationVisible(inviteEmail);

    // Vérifie que l’email d’invitation a été reçu via Mailpit
    const invitationEmail = await getInvitationEmailFromMailpit(inviteEmail);
    expect(invitationEmail.type).toBe('invitation');
    expect(invitationEmail.url).toContain('/invitation/');

    // Simule le parcours de l’invité : nouveau contexte (non connecté)
    const browser = context.browser() as Browser;
    expect(browser, 'Browser context required for invitee flow').toBeDefined();
    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();

    try {
      await inviteePage.goto(invitationEmail.url);

      // Redirigé vers la page de signup de l’auth
      const signupPom = new SignupUserPom(inviteePage);
      await expect(inviteePage.getByTestId('SignUpPage')).toBeVisible({
        timeout: 10000,
      });

      await signupPom.fillStep1(inviteEmail, STRONG_PASSWORD);

      const otp = await getOtpFromMailpit(inviteEmail);
      expect(otp).toMatch(/^\d{6}$/);
      await signupPom.fillStep2(otp);

      const userInfo = {
        nom: 'Invité',
        prenom: 'Marie',
        telephone: '0698765432',
      };
      await signupPom.fillStep3(userInfo);

      // Après signup, redirection vers l’invitation (consommée) puis accueil
      await expect(inviteePage).toHaveURL(/\/collectivite\/\d+/, {
        timeout: 15000,
      });

      // Vérifie que le nouveau membre apparaît dans la liste (en tant qu’invité connecté)
      await inviteePage.goto(`/collectivite/${collectivite.data.id}/users`);
      await expect(
        inviteePage.locator(`[data-test="MembreRow-${inviteEmail}"]`)
      ).toBeVisible({ timeout: 5000 });
    } finally {
      await inviteeContext.close();
    }

    await test.step('cleanup: delete created user', async () => {
      const { db } = databaseService;
      const [createdUser] = await db
        .select({ id: authUsersTable.id })
        .from(authUsersTable)
        .where(eq(authUsersTable.email, inviteEmail));

      await db
        .delete(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, createdUser.id),
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectivite.data.id
            )
          )
        );
      await db.delete(dcpTable).where(eq(dcpTable.id, createdUser.id));
      await db
        .delete(authUsersTable)
        .where(eq(authUsersTable.id, createdUser.id));
    });

    await clearMailpitMailbox(inviteEmail);
  });

  test('invite un utilisateur existant (déjà sur la plateforme) : email rattachement reçu, membre visible', async ({
    collectivites,
    users,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    // Crée un utilisateur existant NON rattaché à cette collectivité
    const existingUser = await users.addUser({
      collectiviteId: undefined,
      role: CollectiviteRole.EDITION,
    });
    const existingEmail = existingUser.data.email;

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);
    await pom.inviteMembre(existingEmail, CollectiviteRole.LECTURE);

    // Utilisateur existant : rattaché immédiatement, apparaît dans la liste des membres
    await pom.expectMembreVisible(existingEmail);

    // Vérifie que l’email de rattachement a été reçu via Mailpit
    const invitationEmail = await getInvitationEmailFromMailpit(existingEmail);
    expect(invitationEmail.type).toBe('rattachement');
    expect(invitationEmail.url).toMatch(/\/collectivite\/|recherches/);

    await clearMailpitMailbox(existingEmail);
  });
});
