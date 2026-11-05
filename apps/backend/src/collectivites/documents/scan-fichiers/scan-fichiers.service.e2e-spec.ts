import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { CollectiviteRole } from '@tet/domain/users';
import { NotifiedOnEnum } from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { type Readable } from 'node:stream';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import { fichierScanTable } from '../models/fichier-scan.table';
import { storageObjectTable } from '../models/storage-object.table';
import { StoreDocumentService } from '../store-document/store-document.service';
import { AntivirusScanner } from './antivirus-scanner';
import { NotifyFichierInfecteService } from './notify-fichier-infecte/notify-fichier-infecte.service';
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

describe('ScanFichiersService', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let collectiviteId: number;
  let adminId: string;
  let scanner: FakeScanner;
  let service: ScanFichiersService;
  let mode: 'audit' | 'enforce';

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
    const { collectivite, users } = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.ADMIN }],
    });
    collectiviteId = collectivite.id;
    adminId = users[0].id;
    scanner = new FakeScanner();
    service = new ScanFichiersService(
      scanner,
      app.get(ScanFichiersRepository),
      app.get(DocumentStorageService),
      {
        get: (key: string) =>
          ({ FICHIER_SCAN_BATCH_SIZE: 50, FICHIER_SCAN_MODE: mode }[key]),
      } as unknown as ConfigurationService,
      app.get(NotifyFichierInfecteService)
    );

    return async () => {
      await db.db
        .delete(notificationTable)
        .where(eq(notificationTable.sendTo, adminId));
    };
  });

  beforeEach(() => {
    scanner.available = true;
    scanner.enabled = true;
    mode = 'audit';
  });

  const isStored = async (hash: string) => {
    const [blob] = await db.db
      .select({ id: storageObjectTable.id })
      .from(storageObjectTable)
      .where(eq(storageObjectTable.name, hash));
    return blob !== undefined;
  };

  const listNotifications = async (hash: string) => {
    const rows = await db.db
      .select({ entityId: notificationTable.entityId })
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.sendTo, adminId),
          eq(
            notificationTable.notifiedOn,
            NotifiedOnEnum['COLLECTIVITES.DOCUMENTS.FICHIER_INFECTE_SUPPRIME']
          )
        )
      );
    return rows.filter(({ entityId }) => entityId?.endsWith(`/${hash}`));
  };

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
      data: {
        skipped: true,
        scanned: 0,
        clean: 0,
        infected: 0,
        errors: 0,
        deleted: 0,
      },
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

  test('analyse un fichier juste déposé, une seule fois', async () => {
    const document = await upload('contenu déposé à l’instant');

    expect(
      await service.scanFichier({ collectiviteId, hash: document.hash })
    ).toEqual({ success: true, data: 'clean' });
    expect(
      await service.scanFichier({ collectiviteId, hash: document.hash })
    ).toEqual({ success: true, data: 'already-scanned' });
    expect(await getVerdict(document.hash)).toMatchObject({ attempts: 1 });
  });

  test('moteur injoignable au dépôt : échec pour que la file réessaie', async () => {
    const document = await upload('contenu en attente de clamd');
    scanner.available = false;

    expect(
      await service.scanFichier({ collectiviteId, hash: document.hash })
    ).toEqual({ success: false, error: 'SCANNER_UNAVAILABLE' });
    expect(await getVerdict(document.hash)).toBeUndefined();
  });

  test('mode enforce : supprime le blob, garde la ligne, prévient les administrateurs une fois', async () => {
    mode = 'enforce';
    const document = await upload(`contenu ${INFECTED_MARKER}`);

    expect(
      await service.scanFichier({ collectiviteId, hash: document.hash })
    ).toEqual({ success: true, data: 'infected' });

    expect(await isStored(document.hash)).toBe(false);
    expect((await getVerdict(document.hash)).deletedAt).not.toBeNull();
    const [ligne] = await db.db
      .select({ id: bibliothequeFichierTable.id })
      .from(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.id, document.id));
    expect(ligne).toBeDefined();
    expect(await listNotifications(document.hash)).toHaveLength(1);

    // Réécrit directement dans le bucket : supprimé à nouveau, sans second
    // message.
    const { bucketId } = await getVerdict(document.hash);
    const rewritten = await app.get(DocumentStorageService).storeDocument({
      bucketId,
      key: document.hash,
      contentType: 'text/plain',
      content: Buffer.from(`réécrit ${INFECTED_MARKER}`),
    });
    expect(rewritten.success).toBe(true);
    expect(await isStored(document.hash)).toBe(true);
    expect(
      await service.scanFichier({ collectiviteId, hash: document.hash })
    ).toEqual({ success: true, data: 'already-scanned' });
    expect(await isStored(document.hash)).toBe(false);
    expect(await listNotifications(document.hash)).toHaveLength(1);
  });

  test("bascule en enforce : le balayage supprime les infectés laissés par l'audit", async () => {
    const document = await upload(`contenu ${INFECTED_MARKER}`);
    expect(
      await service.scanFichier({ collectiviteId, hash: document.hash })
    ).toEqual({ success: true, data: 'infected' });
    expect(await isStored(document.hash)).toBe(true);
    expect(await listNotifications(document.hash)).toHaveLength(0);

    mode = 'enforce';
    for (let i = 0; i < 20 && (await isStored(document.hash)); i++) {
      expect((await service.sweep()).success).toBe(true);
    }

    expect(await isStored(document.hash)).toBe(false);
    expect((await getVerdict(document.hash)).deletedAt).not.toBeNull();
    expect(await listNotifications(document.hash)).toHaveLength(1);
  });
});
