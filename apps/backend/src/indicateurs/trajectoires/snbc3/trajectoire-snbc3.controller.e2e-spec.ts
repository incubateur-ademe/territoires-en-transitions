import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthToken, getTestApp, getTestDatabase } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { failure, success } from '@tet/backend/utils/result.type';
import { randomBytes } from 'crypto';
import { Readable } from 'node:stream';
import request from 'supertest';
import {
  Snbc3ReleaseStorageService,
  XLSX_MIME_TYPE,
} from '../import-snbc3/snbc3-release-storage.service';
import {
  buildSnbc3WorkbookFixture,
  readSelectionCellFixture,
} from '../export-trajectoire-snbc3/snbc3-workbook.test-fixture';
import {
  addTestTrajectoireSnbc3Valeurs,
  mockTrajectoireSnbc3Flag,
} from './trajectoire-snbc3.test-fixture';

const METHODOLOGIE_NAME = 'ADEME-Methodo-Outil-trajectoire-référence-V2.pdf';

describe('GET /trajectoires/snbc3/methodologie', () => {
  let app: INestApplication;
  let authToken: string;
  let collectiviteId: number;
  const pdf = randomBytes(256);

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const { user } = await addTestUser(db);
    authToken = await getAuthToken({
      email: user.email ?? '',
      password: user.password,
    });
    const { collectivite } = await addTestCollectivite(db, { type: 'epci' });
    collectiviteId = collectivite.id;

    // Le stockage est simulé : le bucket `trajectoires-snbc3` est celui de
    // l'app, une spec qui y écrirait remplacerait le PDF de l'import local.
    // La lecture du bucket est testée par snbc3-release-storage.service.spec.
    const spy = vi
      .spyOn(app.get(Snbc3ReleaseStorageService), 'getMethodologie')
      .mockImplementation(async () =>
        success({ stream: Readable.from([pdf]), fileName: METHODOLOGIE_NAME })
      );

    return async () => {
      spy.mockRestore();
      await app.close();
    };
  }, 30000);

  test('sert le PDF stocké par le dernier import, sous son nom d’origine', async () => {
    const response = await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .responseType('blob')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/^application\/pdf/);
    // « é » tient en Latin-1 : Express garde le nom tel quel, sans `filename*`.
    expect(response.headers['content-disposition']).toContain(
      `filename="${METHODOLOGIE_NAME}"`
    );
    expect(Buffer.compare(response.body as Buffer, pdf)).toBe(0);
  });

  test('répond 404 tant qu’aucun import n’a stocké la méthodologie', async () => {
    vi.mocked(
      app.get(Snbc3ReleaseStorageService).getMethodologie
    ).mockResolvedValueOnce(success(null));

    await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  test('refuse sans le flag SNBC 3', async () => {
    const restoreFlag = mockTrajectoireSnbc3Flag(app, false);
    onTestFinished(restoreFlag);

    await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(403);
  });

  test('refuse sans utilisateur authentifié', async () => {
    await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/methodologie?collectiviteId=${collectiviteId}`)
      .expect(401);
  });
});

const WORKBOOK_NAME = 'Trajectoire GES de référence-V2.xlsx';

/** Nom de fichier UTF-8 de `filename*`. */
const getFileName = (contentDisposition: string) =>
  decodeURIComponent(
    contentDisposition.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? ''
  );

/** SIREN fictif, unique d'un run à l'autre. */
const randomSiren = () =>
  `9${Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, '0')}`;

describe('GET /trajectoires/snbc3/telechargement et /trajectoires/snbc3/outil', () => {
  let app: INestApplication;
  let authToken: string;
  const cleanups: (() => Promise<unknown>)[] = [];

  let epci: { id: number; siren: string; nom: string };
  let epciAbsent: { id: number };
  /** Dans le millésime (valeurs `snbc3`), mais pas dans le classeur. */
  let epciNotInWorkbook: { id: number };
  let workbook: Buffer;
  let storage: Snbc3ReleaseStorageService;

  /** Sans droit de lecture des valeurs (profil non vérifié). */
  let authTokenUnverified: string;

  /** Classeur stocké simulé : version et contenu. */
  let stored: { version: string; content: Buffer } | null;
  /** Import complet commencé et pas allé au bout, simulé. */
  let unfinishedImport = false;

  const get = (
    route: 'telechargement' | 'outil',
    collectiviteId: number,
    token = authToken
  ) =>
    request(app.getHttpServer())
      .get(`/trajectoires/snbc3/${route}?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${token}`)
      .responseType('blob');

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const { user } = await addTestUser(db);
    authToken = await getAuthToken({
      email: user.email ?? '',
      password: user.password,
    });
    const unverified = await addTestUser(db, { verified: false });
    cleanups.push(unverified.cleanup);
    authTokenUnverified = await getAuthToken({
      email: unverified.user.email ?? '',
      password: unverified.user.password,
    });

    const addEpci = async (siren: string) => {
      const fixture = await addTestCollectivite(db, {
        type: 'epci',
        natureInsee: 'CA',
        siren,
      });
      cleanups.push(fixture.cleanup);
      return fixture.collectivite;
    };
    const addValeurs = async (collectiviteId: number) => {
      const valeurs = await addTestTrajectoireSnbc3Valeurs(db, collectiviteId, [
        { identifiant: 'cae_1.a', annee: 2030, objectif: 42 },
      ]);
      cleanups.unshift(valeurs.cleanup);
    };

    const siren = randomSiren();
    const created = await addEpci(siren);
    epci = { id: created.id, siren, nom: created.nom ?? '' };
    await addValeurs(epci.id);
    epciAbsent = await addEpci(randomSiren());
    epciNotInWorkbook = await addEpci(randomSiren());
    await addValeurs(epciNotInWorkbook.id);

    workbook = await buildSnbc3WorkbookFixture({
      territoires: [
        {
          code: 200000172,
          libelle: 'CC Préremplie',
          prefilled: true,
        },
        { code: Number(siren), libelle: 'EPCI de test' },
      ],
    });
    stored = { version: randomBytes(8).toString('hex'), content: workbook };

    // Le stockage est simulé, comme pour la méthodologie : écrire dans le
    // bucket remplacerait le classeur de l'import local.
    storage = app.get(Snbc3ReleaseStorageService);
    const spies = [
      vi
        .spyOn(storage, 'getWorkbookInfo')
        .mockImplementation(async () =>
          stored ? { fileName: WORKBOOK_NAME, version: stored.version } : null
        ),
      vi
        .spyOn(storage, 'downloadWorkbook')
        .mockImplementation(async () =>
          stored ? success(stored.content) : failure('READ_DOCUMENT_ERROR')
        ),
      vi
        .spyOn(storage, 'hasUnfinishedImport')
        .mockImplementation(async () => unfinishedImport),
    ];

    return async () => {
      spies.forEach((spy) => spy.mockRestore());
      for (const cleanup of cleanups) await cleanup();
      await app.close();
    };
  }, 30000);

  test('`telechargement` renvoie le classeur ouvert sur l’EPCI', async () => {
    const response = await get('telechargement', epci.id).expect(200);

    expect(response.headers['content-type']).toMatch(
      new RegExp(`^${XLSX_MIME_TYPE}`)
    );
    expect(getFileName(response.headers['content-disposition'])).toBe(
      `Trajectoire SNBC3 - ${epci.siren} - ${epci.nom}.xlsx`
    );
    const body = response.body as Buffer;
    expect(await readSelectionCellFixture(body, 7)).toBe(
      '<c r="A7" s="89" t="inlineStr"><is><t xml:space="preserve">EPCI de test</t></is></c>'
    );
    expect(await readSelectionCellFixture(body, 8)).toBe(
      '<c r="A8" s="89" t="n"/>'
    );
  });

  test('`telechargement` répond 422 pour un EPCI absent du millésime', async () => {
    await get('telechargement', epciAbsent.id).expect(422);
  });

  test('`telechargement` répond 500 si l’EPCI du millésime manque au classeur', async () => {
    await get('telechargement', epciNotInWorkbook.id).expect(500);
  });

  test('`telechargement` refuse un utilisateur sans droit de lecture, sans lire le classeur', async () => {
    const downloads = vi.mocked(storage.downloadWorkbook).mock.calls.length;

    await get('telechargement', epci.id, authTokenUnverified).expect(403);
    expect(vi.mocked(storage.downloadWorkbook).mock.calls.length).toBe(
      downloads
    );
  });

  test('`telechargement` répond 503 pendant un import complet inachevé, `outil` sert le classeur stocké', async () => {
    unfinishedImport = true;
    onTestFinished(() => {
      unfinishedImport = false;
    });

    await get('telechargement', epci.id).expect(503);
    await get('outil', epci.id).expect(200);
  });

  test.each([
    ['commencé pendant l’adaptation', true, false],
    ['allé au bout pendant l’adaptation', false, true],
  ])(
    '`telechargement` répond 503 pour un import complet %s',
    async (_, unfinishedAfter, workbookRewritten) => {
      // avant la lecture : aucun import ; après l'adaptation : l'import
      vi.mocked(storage.hasUnfinishedImport)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(unfinishedAfter);
      const info = { fileName: WORKBOOK_NAME, version: stored?.version ?? '' };
      vi.mocked(storage.getWorkbookInfo)
        .mockResolvedValueOnce(info)
        .mockResolvedValueOnce(
          workbookRewritten ? { ...info, version: 'rewritten-workbook' } : info
        );

      await get('telechargement', epci.id).expect(503);
    }
  );

  test('`outil` renvoie le classeur brut, sous son nom d’origine', async () => {
    const response = await get('outil', epciAbsent.id).expect(200);

    expect(response.headers['content-type']).toMatch(
      new RegExp(`^${XLSX_MIME_TYPE}`)
    );
    expect(getFileName(response.headers['content-disposition'])).toBe(
      WORKBOOK_NAME
    );
    expect(Buffer.compare(response.body as Buffer, workbook)).toBe(0);
  });

  test('répond `WORKBOOK_NOT_FOUND` (404) tant qu’aucun classeur n’est stocké', async () => {
    const saved = stored;
    stored = null;
    onTestFinished(() => {
      stored = saved;
    });

    await get('outil', epciAbsent.id).expect(404);
    await get('telechargement', epci.id).expect(404);
  });

  test('sert le nouveau classeur après un réimport, et garde l’ancien en cache sinon', async () => {
    const saved = stored;
    onTestFinished(() => {
      stored = saved;
    });

    await get('outil', epciAbsent.id).expect(200);
    const downloads = vi.mocked(storage.downloadWorkbook).mock.calls.length;
    await get('outil', epciAbsent.id).expect(200);
    expect(vi.mocked(storage.downloadWorkbook).mock.calls.length).toBe(
      downloads
    );

    const newContent = randomBytes(128);
    stored = { version: randomBytes(8).toString('hex'), content: newContent };
    const response = await get('outil', epciAbsent.id).expect(200);
    expect(Buffer.compare(response.body as Buffer, newContent)).toBe(0);
  });

  test('ne garde pas en cache un échec de lecture du classeur', async () => {
    const saved = stored;
    onTestFinished(() => {
      stored = saved;
    });
    const newContent = randomBytes(128);
    stored = { version: randomBytes(8).toString('hex'), content: newContent };

    vi.mocked(storage.downloadWorkbook).mockImplementationOnce(async () =>
      failure('READ_DOCUMENT_ERROR')
    );
    await get('outil', epciAbsent.id).expect(500);

    // même version : la lecture est retentée
    const response = await get('outil', epciAbsent.id).expect(200);
    expect(Buffer.compare(response.body as Buffer, newContent)).toBe(0);
  });

  test('refuse les deux routes sans le flag SNBC 3', async () => {
    const restoreFlag = mockTrajectoireSnbc3Flag(app, false);
    onTestFinished(restoreFlag);

    await get('telechargement', epci.id).expect(403);
    await get('outil', epci.id).expect(403);
  });

  test('refuse sans utilisateur authentifié', async () => {
    await request(app.getHttpServer())
      .get(`/trajectoires/snbc3/outil?collectiviteId=${epci.id}`)
      .expect(401);
  });
});
