import { INestApplication } from '@nestjs/common';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  CollectiviteRole,
  Dcp,
  defaultUserPreferences,
} from '@tet/domain/users';
import assert from 'assert';
import { and, count, eq, sql } from 'drizzle-orm';
import { utilisateurSupportTable } from '../authorizations/roles/utilisateur-support.table';
import { utilisateurCollectiviteAccessTable } from '../authorizations/utilisateur-collectivite-access.table';

export type TestUserArgs = {
  collectiviteId?: number | null;
  role?: CollectiviteRole;
  prenom?: string;
  nom?: string;
};

const TEST_USER_PASSWORD = 'yolododo';

// ajoute un utilisateur de test
export async function addTestUser(
  { db }: DatabaseServiceInterface,
  {
    collectiviteId,
    role,
    prenom: customPrenom,
    nom: customNom,
  }: TestUserArgs = {
    collectiviteId: null,
    role: CollectiviteRole.EDITION,
  }
): Promise<{
  cleanup: () => Promise<void>;
  user: Dcp & { password: string };
}> {
  const prenom = customPrenom ?? `Y${randomVowel()}l${randomVowel()}`;
  const nom = customNom ?? `D${randomVowel()}d${randomVowel()}`;

  // génère un uuid et un email unique
  const userId = crypto.randomUUID();
  const resp = await db.select({ userCount: count() }).from(authUsersTable);
  const userCount = resp?.[0].userCount;
  assert(userCount > 0, 'User count is valid');
  const email = `${prenom}_${userCount}@${nom}.fr`.toLowerCase();

  // insère l'utilisateur (le trigger sync_dcp crée la ligne dcp)
  await db
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
        rawUserMetaData: { nom, prenom },
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    ])
    .returning()
    .then(([u]) => u);

  await db
    .update(dcpTable)
    .set({ cguAccepteesLe: sql`now()` })
    .where(eq(dcpTable.id, userId));

  await db
    .update(utilisateurVerifieTable)
    .set({ verifie: true })
    .where(eq(utilisateurVerifieTable.userId, userId));

  // rattache l'utilisateur à la collectivité
  if (collectiviteId) {
    await db.insert(utilisateurCollectiviteAccessTable).values([
      {
        userId,
        collectiviteId,
        isActive: true,
        role,
      },
    ]);
  }

  const dcpUser = await db
    .select()
    .from(dcpTable)
    .where(eq(dcpTable.id, userId))
    .then(([u]) => u);

  assert(
    dcpUser,
    `sync_dcp trigger failed to create dcp record for user ${userId}. Check database permissions and trigger configuration.`
  );

  // cleanup
  const cleanup = async () => {
    await db.delete(dcpTable).where(eq(dcpTable.id, userId));
    await db
      .delete(utilisateurVerifieTable)
      .where(eq(utilisateurVerifieTable.userId, userId));
    if (collectiviteId) {
      await db
        .delete(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, userId),
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectiviteId
            )
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
      preferences: defaultUserPreferences,
    },
  };
}

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];
function randomVowel() {
  return VOWELS[Math.floor(Math.random() * (VOWELS.length - 1))];
}

export async function addUserRoleSupport({
  databaseService,
  userId,
  isSupport = true,
  isSuperAdminRoleEnabled = false,
}: {
  databaseService: DatabaseServiceInterface;
  userId: string;
  isSupport?: boolean;
  isSuperAdminRoleEnabled?: boolean;
}) {
  await databaseService.db
    .update(utilisateurSupportTable)
    .set({
      isSupport: isSupport || false,
      isSuperAdminRoleEnabled: isSuperAdminRoleEnabled || false,
    })
    .where(eq(utilisateurSupportTable.userId, userId));

  const cleanup = async () => {
    await databaseService.db
      .update(utilisateurSupportTable)
      .set({ isSupport: false, isSuperAdminRoleEnabled: false })
      .where(eq(utilisateurSupportTable.userId, userId));
  };

  return {
    cleanup,
  };
}

export async function enableUserSuperAdminMode({
  caller,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
}) {
  await caller.users.authorizations.toggleSuperAdminRole({
    isEnabled: true,
  });

  const cleanup = async () => {
    await caller.users.authorizations.toggleSuperAdminRole({
      isEnabled: false,
    });
  };

  return {
    cleanup,
  };
}

export async function addAndEnableUserSuperAdminMode({
  app,
  caller,
  userId,
}: {
  app: INestApplication;
  caller: ReturnType<TrpcRouter['createCaller']>;
  userId: string;
}) {
  const databaseService = app.get(DatabaseService);
  const { cleanup: cleanupAddUserRoleSupport } = await addUserRoleSupport({
    databaseService,
    userId,
  });
  const { cleanup: cleanupEnableUserSuperAdminMode } =
    await enableUserSuperAdminMode({ caller });

  const cleanup = async () => {
    await cleanupEnableUserSuperAdminMode();
    await cleanupAddUserRoleSupport();
  };

  return {
    cleanup,
  };
}

export async function setUserCollectiviteRole(
  { db }: DatabaseServiceInterface,
  {
    userId,
    collectiviteId,
    role,
  }: {
    userId: string;
    collectiviteId: number;
    role: CollectiviteRole;
  }
) {
  await db
    .insert(utilisateurCollectiviteAccessTable)
    .values([
      {
        userId,
        collectiviteId,
        role,
        isActive: true,
      },
    ])
    .onConflictDoUpdate({
      target: [
        utilisateurCollectiviteAccessTable.userId,
        utilisateurCollectiviteAccessTable.collectiviteId,
      ],
      set: {
        role: role,
        isActive: true,
      },
    });

  console.log(`User ${userId} collectivite ${collectiviteId} role ${role} set`);
}

export async function deleteUserCollectiviteRole(
  { db }: DatabaseServiceInterface,
  { userId, collectiviteId }: { userId: string; collectiviteId: number }
) {
  await db
    .delete(utilisateurCollectiviteAccessTable)
    .where(
      and(
        eq(utilisateurCollectiviteAccessTable.userId, userId),
        eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
      )
    )
    .returning()
    .then(([u]) => u);

  console.log(`User ${userId} collectivite ${collectiviteId} role deleted`);
}
