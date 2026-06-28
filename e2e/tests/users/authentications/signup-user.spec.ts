import { expect } from '@playwright/test';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { eq } from 'drizzle-orm';
import { databaseService } from 'tests/shared/database.service';
import {
  clearMailpitMailbox,
  getOtpFromMailpit,
} from 'tests/shared/mailpit.utils';
import { testWithUsers } from 'tests/users/users.fixture';
import { SignupUserPom } from './signup-user.pom';

const test = testWithUsers;

const generateTestEmail = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-signup-${timestamp}-${random}@test-e2e.fr`;
};

// Mot de passe suffisamment robuste pour obtenir un score zxcvbn de 4
const STRONG_PASSWORD = 'kX9#mP2$qR7!bN4@wZ';

const USER_INFO = {
  nom: 'Dupont',
  prenom: 'Jean',
  telephone: '0612345678',
};

async function expectUserCreatedInDb(
  email: string,
  userInfo: typeof USER_INFO
) {
  const { db } = databaseService;
  const [user] = await db
    .select()
    .from(dcpTable)
    .innerJoin(authUsersTable, eq(dcpTable.id, authUsersTable.id))
    .where(eq(authUsersTable.email, email));

  expect(user).toBeDefined();
  expect(user.dcp.nom).toBe(userInfo.nom);
  expect(user.dcp.prenom).toBe(userInfo.prenom);
  expect(user.dcp.cguAccepteesLe).toBeTruthy();
}

async function cleanupSignupUser(email: string) {
  const { db } = databaseService;
  const [user] = await db
    .select({ id: authUsersTable.id })
    .from(authUsersTable)
    .where(eq(authUsersTable.email, email));

  if (user) {
    await db.delete(dcpTable).where(eq(dcpTable.id, user.id));
    await db.delete(authUsersTable).where(eq(authUsersTable.id, user.id));
  }

  await clearMailpitMailbox(email);
}

test.describe('Inscription avec mot de passe', () => {
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    await cleanupSignupUser(testEmail);
  });

  test("S'inscrire et accepter les CGU", async ({ page }) => {
    const pom = new SignupUserPom(page);

    await pom.gotoSignup();
    await pom.fillStep1(testEmail, STRONG_PASSWORD);

    const otp = await getOtpFromMailpit(testEmail);
    expect(otp).toMatch(/^\d{6}$/);

    await pom.fillStep2(otp);
    await pom.fillStep3(USER_INFO);
    await pom.expectSignupComplete(USER_INFO);
    await expectUserCreatedInDb(testEmail, USER_INFO);
  });

  test("Échouer si l'email est déjà associé à un compte", async ({
    page,
    users,
  }) => {
    const existingUser = await users.addUser();
    const pom = new SignupUserPom(page);

    await pom.gotoSignup();
    await pom.fillStep1(existingUser.data.email, STRONG_PASSWORD);
    await pom.expectEmailAlreadyExists();
  });
});

test.describe('Inscription sans mot de passe', () => {
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    await cleanupSignupUser(testEmail);
  });

  test("S'inscrire via le lien magique et accepter les CGU", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const pom = new SignupUserPom(page);

    await pom.gotoSignup();
    await pom.fillStep1(testEmail);
    await pom.expectPasswordlessLinkSent();

    const otp = await getOtpFromMailpit(testEmail);
    expect(otp).toMatch(/^\d{6}$/);

    await pom.completeMagicLink(testEmail, otp);
    const profilePath = await pom.completePasswordlessProfile(USER_INFO);

    await expect(page).toHaveURL(/finaliser-mon-inscription/, {
      timeout: 15000,
    });
    await expect(
      page.getByRole('heading', { name: 'Merci pour votre inscription !' })
    ).toBeVisible();

    const { db } = databaseService;
    const [user] = await db
      .select()
      .from(dcpTable)
      .innerJoin(authUsersTable, eq(dcpTable.id, authUsersTable.id))
      .where(eq(authUsersTable.email, testEmail));

    expect(user).toBeDefined();

    // La modale CGU ferme avant la fin de `updateUser` — on poll la persistence
    await expect
      .poll(
        async () => {
          const [row] = await db
            .select({ cguAccepteesLe: dcpTable.cguAccepteesLe })
            .from(dcpTable)
            .innerJoin(authUsersTable, eq(dcpTable.id, authUsersTable.id))
            .where(eq(authUsersTable.email, testEmail));
          return row?.cguAccepteesLe;
        },
        { timeout: 10000 }
      )
      .toBeTruthy();

    if (profilePath === 'etape3') {
      const [updated] = await db
        .select()
        .from(dcpTable)
        .innerJoin(authUsersTable, eq(dcpTable.id, authUsersTable.id))
        .where(eq(authUsersTable.email, testEmail));
      expect(updated.dcp.nom).toBe(USER_INFO.nom);
      expect(updated.dcp.prenom).toBe(USER_INFO.prenom);
    }
  });
});
