import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, like } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { PREUVES_ARCHIVES_BUCKET } from '../preuves-archive.constants';
import { CollectPreuvesRepository } from './collect-preuves.repository';

const ACTION_ID = 'cae_1.1.3';

describe('CollectPreuvesRepository - filtre confidentiel (SQL réel)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: CollectPreuvesRepository;
  let collectivite: Collectivite;
  let adminUserId: string;
  let cleanupCollectivite: () => Promise<void>;

  let publicHash: string;
  let confidentielHash: string;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    repository = app.get(CollectPreuvesRepository);

    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = fixture.collectivite;
    adminUserId = getAuthUserFromUserCredentials(fixture.user).id;
    cleanupCollectivite = fixture.cleanup;

    publicHash = `hash-public-${collectivite.id}`;
    confidentielHash = `hash-confidentiel-${collectivite.id}`;

    await db.db
      .insert(collectiviteBucketTable)
      .values({ bucketId: PREUVES_ARCHIVES_BUCKET, collectiviteId: collectivite.id });

    const fichiers = await db.db
      .insert(bibliothequeFichierTable)
      .values([
        {
          collectiviteId: collectivite.id,
          hash: publicHash,
          filename: 'public.pdf',
          confidentiel: false,
        },
        {
          collectiviteId: collectivite.id,
          hash: confidentielHash,
          filename: 'secret.pdf',
          confidentiel: true,
        },
      ])
      .returning();

    await db.db.insert(storageObjectTable).values(
      fichiers.map((fichier) => ({
        bucketId: PREUVES_ARCHIVES_BUCKET,
        name: fichier.hash,
        metadata: { size: 1024 },
      }))
    );

    await db.db.insert(preuveComplementaireTable).values([
      ...fichiers.map((fichier) => ({
        collectiviteId: collectivite.id,
        actionId: ACTION_ID,
        fichierId: fichier.id,
        modifiedBy: adminUserId,
      })),
      {
        collectiviteId: collectivite.id,
        actionId: ACTION_ID,
        url: 'https://exemple.fr/lien-public',
        titre: 'Lien public',
        modifiedBy: adminUserId,
      },
    ]);
  });

  afterAll(async () => {
    await db.db
      .delete(preuveComplementaireTable)
      .where(eq(preuveComplementaireTable.collectiviteId, collectivite.id));
    await db.db
      .delete(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, PREUVES_ARCHIVES_BUCKET),
          like(storageObjectTable.name, `%${collectivite.id}`)
        )
      );
    await db.db
      .delete(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.collectiviteId, collectivite.id));
    await cleanupCollectivite();
    await app.close();
  });

  test('canReadConfidentiel=true : expose le fichier public ET le confidentiel', async () => {
    const result = await repository.getComplementairePreuves({
      collectiviteId: collectivite.id,
      canReadConfidentiel: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files.map((file) => file.hash).sort()).toEqual(
      [confidentielHash, publicHash].sort()
    );
  });

  test('canReadConfidentiel=false : masque le confidentiel, garde le public', async () => {
    const result = await repository.getComplementairePreuves({
      collectiviteId: collectivite.id,
      canReadConfidentiel: false,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files.map((file) => file.hash)).toEqual([publicHash]);
  });

  test('un lien (sans fichier) reste visible même sans droit confidentiel', async () => {
    const result = await repository.getComplementairePreuves({
      collectiviteId: collectivite.id,
      canReadConfidentiel: false,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.links.map((link) => link.url)).toEqual([
      'https://exemple.fr/lien-public',
    ]);
  });
});
