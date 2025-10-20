import {
  PermissionLevel,
  PermissionLevelEnum,
} from '@/backend/users/authorizations/roles/permission-level.enum';
import { utilisateurPermissionTable } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { utilisateurVerifieTable } from '@/backend/users/authorizations/roles/utilisateur-verifie.table';
import { authUsersTable } from '@/backend/users/models/auth-users.table';
import { Dcp, dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseServiceInterface } from '@/backend/utils/database/database-service.interface';
import assert from 'assert';
import { and, count, eq, sql } from 'drizzle-orm';

export type TestUserArgs = {
  collectiviteId?: number | null;
  permissionLevel?: PermissionLevel;
  cguAcceptees?: boolean;
};

const TEST_USER_PASSWORD = 'yolododo';

// ajoute un utilisateur de test
export async function addTestUser(
  { db }: DatabaseServiceInterface,
  { collectiviteId, permissionLevel, cguAcceptees }: TestUserArgs = {
    collectiviteId: null,
    permissionLevel: PermissionLevelEnum.EDITION,
    cguAcceptees: true,
  }
): Promise<{
  cleanup: () => Promise<void>;
  user: Dcp & { password: string };
}> {
  const prenom = `Y${randomVowel()}l${randomVowel()}`;
  const nom = `D${randomVowel()}d${randomVowel()}`;

  // génère un uuid et un email unique
  const userId = crypto.randomUUID();
  const resp = await db.select({ userCount: count() }).from(authUsersTable);
  const userCount = resp?.[0].userCount;
  assert(userCount > 0, 'User count is valid');
  const email = `${prenom}_${userCount}@${nom}.fr`.toLowerCase();

  // insère l'utilisateur
  const ret = await db
    .insert(authUsersTable)
    .values([
      {
        instanceId: '00000000-0000-0000-0000-000000000000',
        id: userId,
        aud: 'authenticated',
        role: 'authenticated',
        email,
        encryptedPassword:
          '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C',
        emailConfirmedAt: sql`now()`,
        confirmationToken: '',
        recoveryToken: '',
        emailChangeTokenNew: '',
        emailChange: '',
        rawAppMetaData: {
          provider: 'email',
          providers: ['email'],
        },
        rawUserMetaData: {},
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    ])
    .returning()
    .then(([u]) => u);

  // insère les dcp et les droits
  const dcpUser = await db
    .insert(dcpTable)
    .values([
      {
        userId,
        nom,
        prenom,
        email,
        cguAccepteesLe: cguAcceptees ? sql`now()` : undefined,
      },
    ])
    .returning()
    .then(([dcp]) => dcp);
  await db
    .update(utilisateurVerifieTable)
    .set({ verifie: true })
    .where(eq(utilisateurVerifieTable.userId, userId));

  // rattache l'utilisateur à la collectivité
  if (collectiviteId) {
    await db.insert(utilisateurPermissionTable).values([
      {
        userId,
        collectiviteId,
        isActive: true,
        permissionLevel,
      },
    ]);
  }

  console.log(`Added user ${ret.email} with id ${ret.id}`);

  // cleanup
  const cleanup = async () => {
    console.log(`Cleanup user ${userId}`);
    await db.delete(dcpTable).where(eq(dcpTable.userId, userId));
    await db
      .delete(utilisateurVerifieTable)
      .where(eq(utilisateurVerifieTable.userId, userId));
    if (collectiviteId) {
      await db
        .delete(utilisateurPermissionTable)
        .where(
          and(
            eq(utilisateurPermissionTable.userId, userId),
            eq(utilisateurPermissionTable.collectiviteId, collectiviteId)
          )
        );
    }
    await db.delete(authUsersTable).where(eq(authUsersTable.id, userId));
  };

  return {
    cleanup,
    user: {
      ...dcpUser,
      password: TEST_USER_PASSWORD,
    },
  };
}

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];
function randomVowel() {
  return VOWELS[Math.floor(Math.random() * (VOWELS.length - 1))];
}
