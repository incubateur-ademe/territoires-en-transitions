import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { labellisationDemandeTable } from '@tet/backend/referentiels/labellisations/labellisation-demande.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, sql } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { like } from 'drizzle-orm';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { GeneratePreuvesArchiveService } from './generate-preuves-archive/generate-preuves-archive.service';
import { GeneratePreuvesArchiveWorker } from './generate-preuves-archive/generate-preuves-archive.worker';
import { auditPreuvesArchiveTable } from './models/audit-preuves-archive.table';
import { PREUVES_ARCHIVES_BUCKET } from './preuves-archive.constants';

const MESURE_SOUS_ACTION_ID = 'cae_1.1.3.2';
const COMPLEMENTAIRE_ACTION_ID = 'cae_1.1.3';

// Réutilisation pragmatique du bucket `preuves-archives` (créé par la migration) :
// `storage.buckets` est un schéma Supabase et créer un bucket de test ad-hoc
// demande de connaître son schéma exact (owner, name, public, etc.). Le bucket
// est partagé entre les `storage.objects` simulant les sources et l'upload de
// l'archive — anodin ici puisque les I/O Supabase sont mockés.
const BUCKET_ID = PREUVES_ARCHIVES_BUCKET;

// Second bucket VIDE rattaché à la collectivité : reproduit une collectivité
// fusionnée (plusieurs `collectivite_bucket`). Sans le fix, le LEFT JOIN sur
// `collectivite_id` seul multiplie chaque preuve par bucket et liste les
// fichiers présents comme « manquants ». Aucun objet n'y est stocké.
const EMPTY_BUCKET_ID = 'preuves-archive-e2e-empty-bucket';

describe('Archive de preuves - pipeline complet (ZIP réel)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectivite: Collectivite;
  let adminUser: AuthenticatedUser;
  let cleanupCollectivite: () => Promise<void>;
  let capturedZipDir: string;
  let capturedZipPath: string | null = null;

  beforeAll(async () => {
    capturedZipDir = await mkdtemp(join(tmpdir(), 'preuves-archive-e2e-'));

    app = await getTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(GeneratePreuvesArchiveWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder.overrideProvider(DocumentStorageService).useValue({
          getDocumentStream: async ({ key }: { key: string }) => ({
            success: true,
            data: Readable.from(
              Buffer.from(`fake content for hash ${key}\n`.repeat(8))
            ),
          }),
          storeDocument: async ({
            sourceFilePath,
            key,
          }: {
            sourceFilePath: string;
            key: string;
          }) => {
            capturedZipPath = join(capturedZipDir, key);
            await copyFile(sourceFilePath, capturedZipPath);
            return { success: true, data: { key } };
          },
          createDocumentSignedUrl: async () => ({
            success: true,
            data: { signedUrl: 'https://fake.test/archive.zip' },
          }),
        });
      },
    });
    db = await getTestDatabase(app);
    router = await app.get(TrpcRouter);

    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = fixture.collectivite;
    adminUser = getAuthUserFromUserCredentials(fixture.user);
    cleanupCollectivite = fixture.cleanup;

    await db.db
      .insert(collectiviteBucketTable)
      .values({ bucketId: BUCKET_ID, collectiviteId: collectivite.id });

    await db.db.execute(
      sql`INSERT INTO storage.buckets (id, name, public) VALUES (${EMPTY_BUCKET_ID}, ${'E2E empty bucket'}, false) ON CONFLICT (id) DO NOTHING`
    );
    await db.db
      .insert(collectiviteBucketTable)
      .values({ bucketId: EMPTY_BUCKET_ID, collectiviteId: collectivite.id });
  });

  afterAll(async () => {
    await db.db
      .delete(preuveAuditTable)
      .where(eq(preuveAuditTable.collectiviteId, collectivite.id));
    await db.db
      .delete(preuveLabellisationTable)
      .where(eq(preuveLabellisationTable.collectiviteId, collectivite.id));
    await db.db
      .delete(preuveComplementaireTable)
      .where(eq(preuveComplementaireTable.collectiviteId, collectivite.id));
    await db.db
      .delete(auditPreuvesArchiveTable)
      .where(eq(auditPreuvesArchiveTable.collectiviteId, collectivite.id));
    // Nettoie uniquement les objects qu'on a seedés (suffixés par l'id de la
    // collectivité) — le bucket `preuves-archives` peut contenir d'autres
    // archives d'autres tests.
    await db.db
      .delete(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, BUCKET_ID),
          like(storageObjectTable.name, `%${collectivite.id}`)
        )
      );
    await db.db
      .delete(auditTable)
      .where(eq(auditTable.collectiviteId, collectivite.id));
    await db.db
      .delete(labellisationDemandeTable)
      .where(eq(labellisationDemandeTable.collectiviteId, collectivite.id));
    await cleanupCollectivite();
    await db.db.execute(
      sql`DELETE FROM storage.buckets WHERE id = ${EMPTY_BUCKET_ID}`
    );

    await rm(capturedZipDir, { recursive: true, force: true });
    await app.close();
  });

  test("produit un ZIP avec l'arborescence attendue (3 fichiers + 1 lien CSV)", async () => {
    const caller = router.createCaller({ user: adminUser });

    const [demande] = await db.db
      .insert(labellisationDemandeTable)
      .values({ collectiviteId: collectivite.id, referentiel: 'cae' })
      .returning();
    const [audit] = await db.db
      .insert(auditTable)
      .values({
        collectiviteId: collectivite.id,
        referentielId: 'cae',
        demandeId: demande.id,
      })
      .returning();
    const demandeId = demande.id;
    const auditId = audit.id;

    const { archiveId } = await caller.referentiels.preuvesArchive.request({
      collectiviteId: collectivite.id,
      referentielId: 'cae',
    });

    const fichiers = await db.db
      .insert(bibliothequeFichierTable)
      .values([
        {
          collectiviteId: collectivite.id,
          hash: `hash-mesure-${collectivite.id}`,
          filename: 'preuve-mesure.pdf',
          confidentiel: false,
        },
        {
          collectiviteId: collectivite.id,
          hash: `hash-demande-${collectivite.id}`,
          filename: 'rapport-demande.pdf',
          confidentiel: false,
        },
        {
          collectiviteId: collectivite.id,
          hash: `hash-audit-${collectivite.id}`,
          filename: 'rapport-audit.pdf',
          confidentiel: false,
        },
      ])
      .returning();
    const [fichierMesure, fichierDemande, fichierAudit] = fichiers;

    await db.db.insert(storageObjectTable).values(
      fichiers.map((fichier) => ({
        bucketId: BUCKET_ID,
        name: fichier.hash,
        metadata: { size: 1024 },
      }))
    );

    await db.db.insert(preuveComplementaireTable).values([
      {
        collectiviteId: collectivite.id,
        actionId: MESURE_SOUS_ACTION_ID,
        fichierId: fichierMesure.id,
        modifiedBy: adminUser.id,
      },
      {
        collectiviteId: collectivite.id,
        actionId: COMPLEMENTAIRE_ACTION_ID,
        url: 'https://exemple.fr/ressource',
        titre: 'Une ressource externe',
        modifiedBy: adminUser.id,
      },
    ]);
    await db.db.insert(preuveLabellisationTable).values({
      collectiviteId: collectivite.id,
      demandeId,
      fichierId: fichierDemande.id,
      modifiedBy: adminUser.id,
    });
    await db.db.insert(preuveAuditTable).values({
      collectiviteId: collectivite.id,
      auditId,
      fichierId: fichierAudit.id,
      modifiedBy: adminUser.id,
    });

    const service = app.get(GeneratePreuvesArchiveService);
    const generationResult = await service.generate(archiveId);
    expect(generationResult).toEqual({ success: true });
    expect(capturedZipPath).not.toBeNull();

    const listing = execSync(`unzip -Z1 "${capturedZipPath}"`, {
      encoding: 'utf8',
    });
    const entries = listing.trim().split('\n');

    expect(entries).toContain('cycle-labellisation/demande/rapport-demande.pdf');
    expect(entries).toContain('cycle-labellisation/audit/rapport-audit.pdf');
    expect(
      entries.some(
        (entry) =>
          entry.startsWith('mesures/') && entry.endsWith('/preuve-mesure.pdf')
      )
    ).toBe(true);
    expect(
      entries.some(
        (entry) => entry.startsWith('mesures/') && entry.endsWith('/liens.csv')
      )
    ).toBe(true);

    // Assertion de garde du scénario à 2 buckets monté plus haut (EMPTY_BUCKET_ID,
    // cf. beforeAll). Avant le fix, le LEFT JOIN sur `collectivite_id` seul
    // multipliait chaque preuve par le nombre de buckets rattachés ; la copie
    // jointe au bucket vide n'avait pas d'objet storage et était donc comptée
    // comme introuvable, générant à tort `_manifeste/fichiers-manquants.txt`.
    // L'absence de ce manifeste est précisément ce qui prouve que le produit
    // cartésien ne réapparaît pas : sans cette ligne, le setup EMPTY_BUCKET_ID
    // ne valide plus rien.
    expect(entries).not.toContain('_manifeste/fichiers-manquants.txt');
  });
});
