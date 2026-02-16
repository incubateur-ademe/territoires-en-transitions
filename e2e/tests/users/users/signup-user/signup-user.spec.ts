import { expect, test } from '@playwright/test';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { eq } from 'drizzle-orm';
import { databaseService } from 'tests/shared/database.service';
import {
  clearMailpitMailbox,
  getOtpFromMailpit,
} from 'tests/shared/mailpit.utils';
import { SignupUserPom } from './signup-user.pom';

const generateTestEmail = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-signup-${timestamp}-${random}@test-e2e.fr`;
};

// Mot de passe suffisamment robuste pour obtenir un score zxcvbn de 4
const STRONG_PASSWORD = 'kX9#mP2$qR7!bN4@wZ';

test.describe('Inscription utilisateur', () => {
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    // Nettoyage : supprimer l'utilisateur créé durant le test
    const { db } = databaseService;
    const [user] = await db
      .select({ id: authUsersTable.id })
      .from(authUsersTable)
      .where(eq(authUsersTable.email, testEmail));

    if (user) {
      await db.delete(dcpTable).where(eq(dcpTable.id, user.id));
      await db.delete(authUsersTable).where(eq(authUsersTable.id, user.id));
    }

    await clearMailpitMailbox(testEmail);
  });

  test("S'inscrire et accepter les CGU", async ({ page }) => {
    const pom = new SignupUserPom(page);

    // Étape 0 : naviguer vers la page d'inscription
    await pom.gotoSignup();

    // Étape 1 : saisir email et mot de passe
    await pom.fillStep1(testEmail, STRONG_PASSWORD);

    // Récupérer le code OTP depuis Mailpit
    const otp = await getOtpFromMailpit(testEmail);
    expect(otp).toMatch(/^\d{6}$/);

    // Étape 2 : saisir le code OTP
    await pom.fillStep2(otp);

    // Étape 3 : renseigner les informations personnelles et accepter les CGU
    const userInfo = {
      nom: 'Dupont',
      prenom: 'Jean',
      telephone: '0612345678',
    };
    await pom.fillStep3(userInfo);

    // Vérifier que l'inscription est terminée
    await pom.expectSignupComplete(userInfo);

    // Vérifier que l'utilisateur existe en base avec les CGU acceptées
    const { db } = databaseService;
    const [user] = await db
      .select()
      .from(dcpTable)
      .innerJoin(authUsersTable, eq(dcpTable.id, authUsersTable.id))
      .where(eq(authUsersTable.email, testEmail));

    expect(user).toBeDefined();
    expect(user.dcp.nom).toBe(userInfo.nom);
    expect(user.dcp.prenom).toBe(userInfo.prenom);
    expect(user.dcp.cguAccepteesLe).toBeTruthy();
  });
});
