import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { CollectiviteIdentityRepository } from './collectivite-identity.repository';

describe('CollectiviteIdentityRepository', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: CollectiviteIdentityRepository;
  let collectiviteId: number;
  let collectiviteNom: string;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    repository = new CollectiviteIdentityRepository(db);

    const { collectivite, cleanup } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;
    collectiviteNom = collectivite.nom;
    await db.db
      .update(collectiviteTable)
      .set({ population: 12000 })
      .where(eq(collectiviteTable.id, collectiviteId));

    return async () => {
      await cleanup();
      await app.close();
    };
  });

  it('renvoie le nom et la population de la CT', async () => {
    expect(
      await repository.getCollectiviteIdentity({ collectiviteId })
    ).toEqual({
      success: true,
      data: { nom: collectiviteNom, population: 12000 },
    });
  });

  it('renvoie COLLECTIVITE_NOT_FOUND pour une CT qui n existe pas', async () => {
    expect(
      await repository.getCollectiviteIdentity({ collectiviteId: 999999999 })
    ).toEqual({
      success: false,
      error: 'COLLECTIVITE_NOT_FOUND',
      cause: undefined,
    });
  });
});
