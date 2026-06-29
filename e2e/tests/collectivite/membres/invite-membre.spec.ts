import { Browser, BrowserContext, expect, Page } from '@playwright/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, sql } from 'drizzle-orm';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import {
  clearMailpitMailbox,
  getInvitationEmailFromMailpit,
  getOtpFromMailpit,
} from 'tests/shared/mailpit.utils';
import { SupabaseClient } from 'tests/shared/supabase-client.utils';
import { SignupUserPom } from '../../users/users/signup-user/signup-user.pom';
import { InviteMembrePom } from './invite-membre.pom';

const generateTestEmail = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `invite-${timestamp}-${random}@test-e2e.fr`;
};

// Mot de passe suffisamment robuste pour obtenir un score zxcvbn de 4
const STRONG_PASSWORD = 'kX9#mP2$qR7!bN4@wZ';

/** Évite 127.0.0.1 vs localhost : les cookies de session ne sont pas partagés. */
function invitationUrlPathForPlaywright(fullUrlFromMail: string): string {
  const u = new URL(fullUrlFromMail);
  return `${u.pathname}${u.search}`;
}

async function authenticateBrowserContext(
  browserContext: BrowserContext,
  email: string,
  password: string
) {
  const supabaseClient = new SupabaseClient();
  const { cookie } = await supabaseClient.authenticateUser(email, password);
  await supabaseClient.addAuthCookie(browserContext, cookie);
}

async function openInvitationLinkInAuthenticatedContext(
  browser: Browser,
  invitationUrlFromMail: string,
  email: string,
  password: string
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await authenticateBrowserContext(context, email, password);
  await page.goto(invitationUrlPathForPlaywright(invitationUrlFromMail), {
    waitUntil: 'load',
  });
  return { context, page };
}

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
      await inviteePage.goto(invitationUrlPathForPlaywright(invitationEmail.url));

      // Redirigé vers la page de signup (servie par l’app, same-origin)
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

  test('lien valide, utilisateur déjà connecté avec le bon email : consommation au clic', async ({
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

    const invitationEmail = await getInvitationEmailFromMailpit(inviteEmail);

    const browser = context.browser() as Browser;
    expect(browser, 'Browser context required for invitee flow').toBeDefined();
    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();

    try {
      const signupPom = new SignupUserPom(inviteePage);
      await signupPom.gotoSignup();
      await signupPom.fillStep1(inviteEmail, STRONG_PASSWORD);
      const otp = await getOtpFromMailpit(inviteEmail);
      await signupPom.fillStep2(otp);
      await signupPom.fillStep3({
        nom: 'Connecté',
        prenom: 'AvantLien',
        telephone: '0698765430',
      });

      await expect(
        inviteePage.getByRole('heading', {
          name: 'Merci pour votre inscription !',
        })
      ).toBeVisible({ timeout: 15000 });

      await inviteePage.goto(invitationUrlPathForPlaywright(invitationEmail.url), {
        waitUntil: 'load',
      });
      await expect(inviteePage).not.toHaveURL(/error=invitation/, {
        timeout: 15000,
      });

      await inviteePage.goto(`/collectivite/${collectivite.data.id}/users`);
      await expect(
        inviteePage.locator(`[data-test="MembreRow-${inviteEmail}"]`)
      ).toBeVisible({ timeout: 10000 });
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

  test('lien d’invitation : utilisateur connecté avec un autre email → redirection vers la connexion', async ({
    collectivites,
    users,
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

    const invitationEmail = await getInvitationEmailFromMailpit(inviteEmail);

    const wrongUser = await users.addUser({
      collectiviteId: undefined,
      role: CollectiviteRole.EDITION,
    });

    const browser = context.browser() as Browser;
    const { context: wrongContext, page: wrongPage } =
      await openInvitationLinkInAuthenticatedContext(
        browser,
        invitationEmail.url,
        wrongUser.data.email,
        wrongUser.data.password
      );

    try {
      await expect(wrongPage).toHaveURL(/\/login/, { timeout: 15000 });
      const loginUrl = new URL(wrongPage.url());
      expect(loginUrl.searchParams.get('email')).toBe(inviteEmail);
      expect(loginUrl.searchParams.get('redirect_to')).toContain('/invitation/');
    } finally {
      await wrongContext.close();
    }

    await clearMailpitMailbox(inviteEmail);
  });

  test('lien avec id d’invitation invalide → erreur sur finaliser-mon-inscription', async ({
    users,
    context,
  }) => {
    test.setTimeout(60_000);

    const loggedInUser = await users.addUser({
      collectiviteId: undefined,
      role: CollectiviteRole.EDITION,
    });

    const browser = context.browser() as Browser;
    const invalidInvitationId = crypto.randomUUID();
    const invitationPath = `/invitation/${invalidInvitationId}/${encodeURIComponent(loggedInUser.data.email)}`;

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    try {
      await authenticateBrowserContext(
        guestContext,
        loggedInUser.data.email,
        loggedInUser.data.password
      );
      await guestPage.goto(invitationPath, { waitUntil: 'load' });

      await expect(guestPage).toHaveURL(/error=invitation/, { timeout: 20000 });
      await expect(
        guestPage.getByText("L'invitation n'a pas pu être traitée")
      ).toBeVisible();
    } finally {
      await guestContext.close();
    }
  });

  test('invitation avec casse différente entre JWT et base : consommation OK', async ({
    collectivites,
    page,
    context,
  }) => {
    test.setTimeout(60_000);

    const localPart = `case${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const inviteEmail = `${localPart}@test-e2e.fr`;
    const upperEmail = `${localPart.toUpperCase()}@test-e2e.fr`;

    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);
    await pom.inviteMembre(inviteEmail, CollectiviteRole.LECTURE);

    const invitationEmailInfo = await getInvitationEmailFromMailpit(inviteEmail);
    const invitationId = invitationEmailInfo.url.match(
      /\/invitation\/([0-9a-f-]{36})\//i
    )?.[1];
    expect(invitationId).toBeTruthy();
    if (!invitationId) {
      return;
    }

    const { db } = databaseService;
    await db.execute(
      sql`UPDATE utilisateur.invitation SET email = ${upperEmail} WHERE id = ${invitationId}`
    );

    const browser = context.browser() as Browser;
    const inviteeContext = await browser.newContext();
    const inviteePage = await inviteeContext.newPage();

    try {
      const signupPom = new SignupUserPom(inviteePage);
      await signupPom.gotoSignup();
      await signupPom.fillStep1(inviteEmail, STRONG_PASSWORD);
      const otp = await getOtpFromMailpit(inviteEmail);
      await signupPom.fillStep2(otp);
      await signupPom.fillStep3({
        nom: 'CasSe',
        prenom: 'Test',
        telephone: '0698765431',
      });

      await expect(inviteePage).toHaveURL(/\/finaliser-mon-inscription/, {
        timeout: 15000,
      });

      const invitationPath = `/invitation/${invitationId}/${encodeURIComponent(upperEmail)}`;
      await inviteePage.goto(invitationPath, { waitUntil: 'load' });

      await expect(inviteePage).not.toHaveURL(/error=invitation/, {
        timeout: 15000,
      });

      const [userRow] = await db
        .select({ id: authUsersTable.id })
        .from(authUsersTable)
        .where(eq(authUsersTable.email, inviteEmail))
        .limit(1);
      expect(userRow).toBeDefined();

      const [accessRow] = await db
        .select({ id: utilisateurCollectiviteAccessTable.id })
        .from(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, userRow.id),
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectivite.data.id
            )
          )
        )
        .limit(1);
      expect(accessRow).toBeDefined();
    } finally {
      await inviteeContext.close();
    }

    await test.step('cleanup: delete created user', async () => {
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
      await db.execute(
        sql`DELETE FROM utilisateur.invitation WHERE id = ${invitationId}`
      );
      await db.delete(dcpTable).where(eq(dcpTable.id, createdUser.id));
      await db
        .delete(authUsersTable)
        .where(eq(authUsersTable.id, createdUser.id));
    });

    await clearMailpitMailbox(inviteEmail);
  });
});
