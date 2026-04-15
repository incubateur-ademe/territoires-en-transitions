import { CollectiviteNatureType } from '@tet/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { cotTable } from '@tet/backend/referentiels/labellisations/cot.table';
import {
  addTestUser,
  TestUserArgs,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import {
  Collectivite,
  CollectivitePreferences,
  CollectiviteType,
  collectiviteTypeEnum,
  CreateCollectivite,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { Dcp } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import { utilisateurCollectiviteAccessTable } from '../../users/authorizations/utilisateur-collectivite-access.table';
import { bibliothequeFichierTable } from '../documents/models/bibliotheque-fichier.table';
import { invitationTable } from '../membres/invitation.table';
import { invitationPersonneTagTable } from '../membres/mutate-invitations/invitation-personne-tag.table';
import { financeurTagTable } from '../tags/financeur-tag.table';
import { reponseBinaireTable } from '../personnalisations/models/reponse-binaire.table';
import { reponseChoixTable } from '../personnalisations/models/reponse-choix.table';
import { reponseProportionTable } from '../personnalisations/models/reponse-proportion.table';
import { collectiviteTable } from '../shared/models/collectivite.table';

/** Supprime droits et invitations (prérequis avant suppression des users) */
export async function cleanupCollectivitePrerequisites(
  { db }: DatabaseServiceInterface,
  collectiviteId: number
): Promise<void> {
  // D'abord supprimer les droits (ils référencent invitation_id)
  await db
    .delete(utilisateurCollectiviteAccessTable)
    .where(
      eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
    );

  const invitationsToDelete = await db
    .select({ id: invitationTable.id })
    .from(invitationTable)
    .where(eq(invitationTable.collectiviteId, collectiviteId));
  for (const inv of invitationsToDelete) {
    await db
      .delete(invitationPersonneTagTable)
      .where(eq(invitationPersonneTagTable.invitationId, inv.id));
  }
  await db
    .delete(invitationTable)
    .where(eq(invitationTable.collectiviteId, collectiviteId));
}

export async function setCollectiviteAsCOT(
  { db }: DatabaseServiceInterface,
  collectiviteId: number,
  isCOT: boolean
): Promise<void> {
  if (isCOT) {
    await db.insert(cotTable).values({
      collectiviteId: collectiviteId,
      actif: true,
      signataire: collectiviteId,
    });
  } else {
    await db
      .delete(cotTable)
      .where(eq(cotTable.collectiviteId, collectiviteId));
  }
}

// ajoute une collectivité
export async function addTestCollectivite(
  { db }: DatabaseServiceInterface,
  collectiviteArgs: Partial<Collectivite> & { isCOT?: boolean } = {}
): Promise<{ collectivite: Collectivite; cleanup: () => Promise<void> }> {
  const { isCOT, ...collectiviteInput } = collectiviteArgs;
  const createCollectivite: CreateCollectivite & {
    preferences: CollectivitePreferences;
  } = {
    ...collectiviteInput,
    nom:
      collectiviteArgs.nom ||
      `Collectivité ${Math.random().toString().substring(2, 6)}`,
    type: collectiviteArgs.type || collectiviteTypeEnum.EPCI,
    preferences: collectiviteArgs.preferences || defaultCollectivitePreferences,
  };

  try {
    const result = await db
      .insert(collectiviteTable)
      .values([createCollectivite])
      .returning()
      .then(([c]) => ({
        ...c,
        natureInsee: c.natureInsee as CollectiviteNatureType | null,
        type: c.type as CollectiviteType,
      }));

    if (collectiviteArgs.isCOT) {
      await setCollectiviteAsCOT({ db }, result.id, true);
    }

    console.log(`Added collectivite ${result.nom} with id ${result.id}`);
    const collectiviteId = result?.id;

    const cleanup = async () => {
      if (collectiviteId) {
        try {
          await db
            .delete(bibliothequeFichierTable)
            .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId));
          await db
            .delete(collectiviteBucketTable)
            .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));
          await db
            .delete(cotTable)
            .where(eq(cotTable.collectiviteId, collectiviteId));
          await db
            .delete(reponseBinaireTable)
            .where(eq(reponseBinaireTable.collectiviteId, collectiviteId));
          await db
            .delete(reponseChoixTable)
            .where(eq(reponseChoixTable.collectiviteId, collectiviteId));
          await db
            .delete(reponseProportionTable)
            .where(eq(reponseProportionTable.collectiviteId, collectiviteId));
          await db
            .delete(financeurTagTable)
            .where(eq(financeurTagTable.collectiviteId, collectiviteId));
          await db
            .delete(collectiviteTable)
            .where(eq(collectiviteTable.id, collectiviteId));
        } catch (error) {
          if (error instanceof DatabaseError) {
            console.error(
              `Database error: ${error.code} (${error.constraint}) - ${error.detail}`
            );
          }
          console.error(
            `Error cleaning up collectivite ${collectiviteId}: ${getErrorMessage(
              error
            )}`
          );
          throw error;
        }
      }
    };
    return {
      collectivite: result,
      cleanup,
    };
  } catch (err) {
    throw new Error(
      `Error adding collectivite on database ${
        process.env.SUPABASE_DATABASE_URL
      }: ${getErrorMessage(err)}`
    );
  }
}

// ajoute une collectivité et un utilisateur rattaché à celle-ci
export async function addTestCollectiviteAndUser(
  { db }: DatabaseServiceInterface,
  args?: {
    user: Omit<TestUserArgs, 'collectiviteId'>;
    collectivite?: Partial<Collectivite>;
  }
): Promise<{
  collectivite: Collectivite;
  user: Dcp & { password: string };
  cleanup: () => Promise<void>;
}> {
  const { collectivite, cleanup: collectiviteCleanup } =
    await addTestCollectivite({ db }, args?.collectivite);

  const { user, cleanup: userCleanup } = await addTestUser(
    { db },
    {
      ...(args?.user ?? {}),
      collectiviteId: collectivite.id,
    }
  );
  const cleanup = async () => {
    await userCleanup();
    await collectiviteCleanup();
  };
  return { collectivite, user, cleanup };
}

export async function addTestCollectiviteAndUsers(
  { db }: DatabaseServiceInterface,
  args: {
    users: Omit<TestUserArgs, 'collectiviteId'>[];
    collectivite?: Partial<Collectivite> & { isCOT?: boolean };
  }
): Promise<{
  collectivite: Collectivite;
  users: (Dcp & { password: string })[];
  cleanup: () => Promise<void>;
}> {
  const { collectivite, cleanup: collectiviteCleanup } =
    await addTestCollectivite({ db }, args?.collectivite);

  const usersResults = await Promise.all(
    args?.users.map(async (user) => {
      return await addTestUser(
        { db },
        {
          ...user,
          collectiviteId: collectivite.id,
        }
      );
    })
  );

  const usersCleanup = async () => {
    await Promise.all(
      usersResults.map(async (userResult) => {
        await userResult.cleanup();
      })
    );
  };

  const users = usersResults.map((userResult) => userResult.user);

  const cleanup = async () => {
    await usersCleanup();
    await collectiviteCleanup();
  };
  return { collectivite, users, cleanup };
}
