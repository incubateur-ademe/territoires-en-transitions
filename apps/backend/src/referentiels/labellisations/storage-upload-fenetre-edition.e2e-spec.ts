import { addTestCollectivite, addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import {
  getSupabaseClient,
  getTestApp,
  getTestDatabase,
  signInWith,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, test } from 'vitest';
import { auditTable } from './audit.table';
import {
  addAuditeurPermission,
  createAudit,
} from './labellisations.test-fixture';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number): string =>
  new Date(Date.now() - days * DAY_IN_MS).toISOString();

const fakePng = Buffer.from('\x89PNG fake bytes for storage rls test');

describe("RLS storage.objects - fenetre d'edition de l'auditeur", () => {
  let databaseService: DatabaseService;
  let bucketInWindow: string;
  let bucketOutWindow: string;

  beforeAll(async () => {
    const app = await getTestApp();
    databaseService = await getTestDatabase(app);
    const db = databaseService.db;

    // Auditeur externe : membre d'aucune des collectivites auditees, sinon
    // is_bucket_writer passerait par is_any_role_on et masquerait la policy.
    const { users } = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.LECTURE }],
    });
    const auditeur = users[0];

    const createBucketFor = async (collectiviteId: number): Promise<string> => {
      await db.execute(
        sql`select private.create_bucket(c) from public.collectivite c where c.id = ${collectiviteId}`
      );
      const [bucket] = await db
        .select({ id: collectiviteBucketTable.bucketId })
        .from(collectiviteBucketTable)
        .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));
      return bucket.id;
    };

    const assignClosAudit = async (
      collectiviteId: number,
      dateFin: string
    ): Promise<void> => {
      const { audit } = await createAudit({
        databaseService,
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
        clos: true,
      });
      await db
        .update(auditTable)
        .set({ dateFin })
        .where(eq(auditTable.id, audit.id));
      await addAuditeurPermission({
        databaseService,
        auditId: audit.id,
        userId: auditeur.id,
      });
    };

    const { collectivite: inWindow } = await addTestCollectivite(databaseService);
    const { collectivite: outWindow } =
      await addTestCollectivite(databaseService);
    bucketInWindow = await createBucketFor(inWindow.id);
    bucketOutWindow = await createBucketFor(outWindow.id);
    await assignClosAudit(inWindow.id, daysAgo(2));
    await assignClosAudit(outWindow.id, daysAgo(20));

    await signInWith({ email: auditeur.email, password: auditeur.password });
  });

  test("autorise l'upload storage sur un audit clos depuis 2 jours", async () => {
    const { error } = await getSupabaseClient()
      .storage.from(bucketInWindow)
      .upload('rapport-audit.png', fakePng, { contentType: 'image/png' });

    expect(error).toBeNull();
  });

  test("refuse l'upload storage sur un audit clos depuis 20 jours", async () => {
    const { error } = await getSupabaseClient()
      .storage.from(bucketOutWindow)
      .upload('rapport-audit.png', fakePng, { contentType: 'image/png' });

    expect(error).not.toBeNull();
  });
});
