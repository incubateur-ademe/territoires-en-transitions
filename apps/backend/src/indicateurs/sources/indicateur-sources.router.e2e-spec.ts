import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import { ConvertJwtToAuthUserService } from '@tet/backend/users/convert-jwt-to-auth-user.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { onTestFinished } from 'vitest';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import IndicateurSourcesService from './indicateur-sources.service';

describe('IndicateurSourcesRouter', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let service: IndicateurSourcesService;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new FakeLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    database = await getTestDatabase(app);
    service = app.get(IndicateurSourcesService);
  });

  afterAll(async () => {
    await app.close();
  });

  function createSourceFixture() {
    const source = { id: `test-${randomUUID()}`, libelle: 'Source de test' };
    onTestFinished(async () => {
      await database.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.sourceId, source.id));
      await database.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, source.id));
    });
    return source;
  }

  it('creates distinct metadata for the same source and date in the caller transaction', async () => {
    const source = createSourceFixture();
    const dateVersion = '2026-01-01T00:00:00.000Z';

    const metadonnees = await database.db.transaction(async (tx) => {
      await service.upsertIndicateurSource(source, tx);
      const first = await service.createIndicateurSourceMetadonnee(
        { sourceId: source.id, dateVersion, nomDonnees: 'Premier jeu' },
        tx
      );
      await expect(
        service.getIndicateurSourceMetadonnee(source.id, dateVersion, tx)
      ).resolves.toEqual(first);
      const second = await service.createIndicateurSourceMetadonnee(
        { sourceId: source.id, dateVersion, nomDonnees: 'Second jeu' },
        tx
      );
      return [first, second];
    });

    expect(metadonnees[0].id).not.toBe(metadonnees[1].id);
    const stored = await database.db
      .select()
      .from(indicateurSourceMetadonneeTable)
      .where(eq(indicateurSourceMetadonneeTable.sourceId, source.id))
      .orderBy(indicateurSourceMetadonneeTable.id);
    expect(stored).toEqual(metadonnees);
  });

  it('rolls back both source and metadata when the caller transaction fails', async () => {
    const source = createSourceFixture();

    await expect(
      database.db.transaction(async (tx) => {
        await service.upsertIndicateurSource(source, tx);
        await service.createIndicateurSourceMetadonnee(
          { sourceId: source.id, dateVersion: '2026-01-01' },
          tx
        );
        throw new Error('Transaction annulée');
      })
    ).rejects.toThrow('Transaction annulée');

    expect(
      await database.db
        .select()
        .from(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, source.id))
    ).toEqual([]);
    expect(
      await database.db
        .select()
        .from(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.sourceId, source.id))
    ).toEqual([]);
  });

  it('preserves existing source and metadata after a failed transaction', async () => {
    const source = createSourceFixture();
    await service.upsertIndicateurSource(source);
    const original = await service.createIndicateurSourceMetadonnee({
      sourceId: source.id,
      dateVersion: '2026-01-01',
      nomDonnees: 'Jeu existant',
    });

    await expect(
      database.db.transaction(async (tx) => {
        await service.upsertIndicateurSource(
          { ...source, libelle: 'Libellé modifié' },
          tx
        );
        await service.createIndicateurSourceMetadonnee(
          { sourceId: source.id, dateVersion: '2026-01-01' },
          tx
        );
        throw new Error('Transaction annulée');
      })
    ).rejects.toThrow('Transaction annulée');

    expect(
      await database.db
        .select()
        .from(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, source.id))
    ).toEqual([{ ...source, ordreAffichage: null }]);
    expect(
      await database.db
        .select()
        .from(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.sourceId, source.id))
    ).toEqual([original]);
  });

  it('returns sources and rejects an API key without read permission', async () => {
    const owner = await addTestCollectiviteAndUser(database, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const router = app.get(TrpcRouter);
    const ownerUser = getAuthUserFromUserCredentials(owner.user);
    const token = signTestAuthToken(
      { ...ownerUser.jwtPayload, sub: ownerUser.id },
      app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
    );
    const user = await app
      .get(ConvertJwtToAuthUserService)
      .convertJwtToAuthUser(token);
    const caller = router.createCaller({ user });
    const indicateurId = await caller.indicateurs.indicateurs.create({
      collectiviteId: owner.collectivite.id,
      titre: 'Indicateur sans source',
    });
    const input = { collectiviteId: owner.collectivite.id, indicateurId };

    await expect(caller.indicateurs.sources.available(input)).resolves.toEqual(
      []
    );
    const restrictedCaller = router.createCaller({
      user: {
        ...ownerUser,
        jwtPayload: { ...ownerUser.jwtPayload, permissions: [] },
      },
    });
    await expect(
      restrictedCaller.indicateurs.sources.available(input)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
