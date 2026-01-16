import { INestApplication } from '@nestjs/common';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole, Dcp } from '@tet/domain/users';
import assert from 'assert';
import { and, count, eq, sql } from 'drizzle-orm';
import { UpdateUserRoleService } from '../authorizations/update-user-role/update-user-role.service';
import { utilisateurCollectiviteAccessTable } from '../authorizations/utilisateur-collectivite-access.table';

export type TestUserArgs = {
  collectiviteId?: number | null;
  accessLevel?: CollectiviteRole;
  cguAcceptees?: boolean;
};

const TEST_USER_PASSWORD = 'yolododo';

// ajoute un utilisateur de test
export async function addTestUser(
  { db }: DatabaseServiceInterface,
  { collectiviteId, accessLevel, cguAcceptees }: TestUserArgs = {
    collectiviteId: null,
    accessLevel: CollectiviteRole.EDITION,
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
        id: userId,
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
    await db.insert(utilisateurCollectiviteAccessTable).values([
      {
        userId,
        collectiviteId,
        isActive: true,
        accessLevel,
      },
    ]);
  }

  console.log(`Added user ${ret.email} with id ${ret.id}`);

  // cleanup
  const cleanup = async () => {
    console.log(`Cleanup user ${userId}`);
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
    },
  };
}

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];
function randomVowel() {
  return VOWELS[Math.floor(Math.random() * (VOWELS.length - 1))];
}

export async function addUserRoleSupport({
  app,
  userId,
  isSupport = true,
}: {
  app: INestApplication;
  userId: string;
  isSupport?: boolean;
}) {
  const updateRoleService = app.get(UpdateUserRoleService);
  await updateRoleService.setIsSupport(userId, isSupport);

  const cleanup = async () => {
    await updateRoleService.setIsSupport(userId, false);
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
  const { cleanup: cleanupAddUserRoleSupport } = await addUserRoleSupport({
    app,
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
