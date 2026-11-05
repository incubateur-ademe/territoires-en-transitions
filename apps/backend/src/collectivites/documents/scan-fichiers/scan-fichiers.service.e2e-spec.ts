import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { type Readable } from 'node:stream';
import { fichierScanTable } from '../models/fichier-scan.table';
import { storageObjectTable } from '../models/storage-object.table';
import { StoreDocumentService } from '../store-document/store-document.service';
import { AntivirusScanner } from './antivirus-scanner';
import { ScanFichiersRepository } from './scan-fichiers.repository';
import {
  MAX_SCAN_ATTEMPTS,
  ScanFichiersService,
} from './scan-fichiers.service';

const INFECTED_MARKER = 'MARQUEUR-INFECTE';

const readAll = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString();
};

/** Faux moteur : infecté si le contenu porte le marqueur. */
class FakeScanner extends AntivirusScanner {
  available = true;
  enabled = true;
  isEnabled() {
    return this.enabled;
  }
  async getEngineVersion() {
    return this.available
      ? success('Fake 1.0/1')
      : failure('SCANNER_UNAVAILABLE' as const);
  }
  async scan(content: Readable) {
    const text = await readAll(content);
    return text.includes(INFECTED_MARKER)
      ? success({ status: 'infected' as const, signature: 'Fake.Signature' })
      : success({ status: 'clean' as const });
  }
}

describe('ScanFichiersService (mode audit)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let collectiviteId: number;
  let scanner: FakeScanner;
  let service: ScanFichiersService;

  const upload = async (content: string) => {
    const result = await app.get(StoreDocumentService).uploadBuffer(
      collectiviteId,
      {
        buffer: Buffer.from(`${content} ${randomUUID()}`),
        originalname: 'fichier.txt',
        mimetype: 'text/plain',
      } as Express.Multer.File,
      false
    );
    if (!result.success) {
      throw new Error(`Dépôt impossible : ${result.error}`);
    }
    return result.data;
  };

  const getVerdict = async (hash: string) => {
    const [verdict] = await db.db
      .select()
      .from(fichierScanTable)
      .where(eq(fichierScanTable.objectName, hash));
    return verdict;
  };

  /** D'autres specs déposent en parallèle : on balaie jusqu'à atteindre nos objets. */
  const sweepUntilScanned = async (hashes: string[]) => {
    for (let i = 0; i < 20; i++) {
      const result = await service.sweep();
      expect(result.success).toBe(true);
      const verdicts = await Promise.all(hashes.map(getVerdict));
      if (verdicts.every(Boolean)) {
        return verdicts;
      }
    }
    throw new Error('Objets jamais analysés');
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    const { collectivite } = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.ADMIN }],
    });
    collectiviteId = collectivite.id;
    scanner = new FakeScanner();
    service = new ScanFichiersService(
      scanner,
      app.get(ScanFichiersRepository),
      app.get(DocumentStorageService),
      {
        get: (key: string) =>
          key === 'FICHIER_SCAN_BATCH_SIZE' ? 50 : undefined,
      } as unknown as ConfigurationService
    );
  });

  beforeEach(() => {
    scanner.available = true;
    scanner.enabled = true;
  });

  test('consigne les verdicts sans rien supprimer', async () => {
    const sain = await upload('contenu sain');
    const infecte = await upload(`contenu ${INFECTED_MARKER}`);

    const [verdictSain, verdictInfecte] = await sweepUntilScanned([
      sain.hash,
      infecte.hash,
    ]);

    expect(verdictSain).toMatchObject({
      status: 'clean',
      signature: null,
      engineVersion: 'Fake 1.0/1',
    });
    expect(verdictInfecte).toMatchObject({
      status: 'infected',
      signature: 'Fake.Signature',
      deletedAt: null,
    });

    const [blob] = await db.db
      .select({ id: storageObjectTable.id })
      .from(storageObjectTable)
      .where(
        and(
          eq(storageObjectTable.bucketId, verdictInfecte.bucketId),
          eq(storageObjectTable.name, infecte.hash)
        )
      );
    expect(blob).toBeDefined();
  });

  test('ne repasse pas un objet déjà analysé', async () => {
    const document = await upload('contenu analysé une fois');
    const [verdict] = await sweepUntilScanned([document.hash]);

    await service.sweep();

    expect(await getVerdict(document.hash)).toMatchObject({
      attempts: 1,
      scannedAt: verdict.scannedAt,
    });
  });

  test('sans moteur configuré, le balayage ne fait rien', async () => {
    scanner.enabled = false;
    expect(await service.sweep()).toEqual({
      success: true,
      data: { skipped: true, scanned: 0, clean: 0, infected: 0, errors: 0 },
    });
  });

  test('moteur injoignable : échec, et aucun verdict', async () => {
    const document = await upload('contenu en attente');
    scanner.available = false;

    expect(await service.sweep()).toEqual({
      success: false,
      error: 'SCANNER_UNAVAILABLE',
    });
    expect(await getVerdict(document.hash)).toBeUndefined();
  });

  test(`un objet en erreur est retenté jusqu'à ${MAX_SCAN_ATTEMPTS} fois, puis laissé de côté`, async () => {
    const repository = app.get(ScanFichiersRepository);
    const document = await upload('contenu illisible');
    const [{ bucketId }] = await db.db
      .select({ bucketId: storageObjectTable.bucketId })
      .from(storageObjectTable)
      .where(eq(storageObjectTable.name, document.hash));
    const object = { bucketId: bucketId as string, objectName: document.hash };
    const isSelected = async () =>
      (
        await repository.listObjectsToScan({
          limit: 1000,
          maxAttempts: MAX_SCAN_ATTEMPTS,
        })
      ).some((o) => o.objectName === document.hash);

    for (let attempt = 1; attempt <= MAX_SCAN_ATTEMPTS; attempt++) {
      expect(await isSelected()).toBe(true);
      await repository.upsertVerdict({
        ...object,
        status: 'error',
        signature: null,
        engineVersion: null,
      });
    }

    expect(await getVerdict(document.hash)).toMatchObject({
      status: 'error',
      attempts: MAX_SCAN_ATTEMPTS,
    });
    expect(await isSelected()).toBe(false);
  });
});
