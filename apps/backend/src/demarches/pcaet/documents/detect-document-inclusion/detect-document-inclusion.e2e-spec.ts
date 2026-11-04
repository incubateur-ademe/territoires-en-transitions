import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { demarcheDocumentDetectionTable } from '@tet/backend/demarches/shared/models/demarche-document-detection.table';
import { demarcheDocumentTable } from '@tet/backend/demarches/shared/models/demarche-document.table';
import { getDisposableTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import {
  LlmCompletionRequest,
  LlmRepository,
} from '@tet/backend/utils/llm/repositories/llm.repository';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  computeDemarcheDocumentsCoverage,
  listDemarcheDocumentSubstitutsDeposes,
  type DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  addTestBibliothequeFichier,
  createDemarche,
} from '../../demarches-pcaet.test-fixture';
import {
  DETECT_DOCUMENT_INCLUSION_QUEUE_NAME,
  type DetectDocumentInclusionJobData,
} from './detect-document-inclusion.queue';
import { DetectDocumentInclusionService } from './detect-document-inclusion.service';
import { DetectDocumentInclusionWorker } from './detect-document-inclusion.worker';

const PLCF = 'pcaet_plan_chaleur_froid';

/** Une section dédiée : le modèle factice la reconnaît à son titre. */
const AVEC_SECTION_PLCF = [
  'Partie 4 – Plan local de chaleur et de froid',
  'Diagnostic des besoins de chaleur : 3 réseaux de chaleur desservent 12 000 logements.',
  'Objectif : 45 % de chaleur renouvelable en 2030.',
].join('\n');
/** Une simple mention, que le modèle doit écarter. */
const MENTION_PLCF =
  'Le plan local de chaleur et de froid sera élaboré dans un second temps.';
/** Aucune occurrence : pas d'appel au modèle. */
const SANS_PLCF = 'Les émissions du transport routier baissent de 2 % par an.';

const fakeLlm: { calls: number; failing: boolean } = {
  calls: 0,
  failing: false,
};

class FakeLlmRepository extends LlmRepository {
  readonly maxConcurrentCalls = 4;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  readonly capabilities = { ocr: false, strategy: 'whole-document' as const };

  maxInputTokensFor(): number {
    return 60_000;
  }

  modelFor(): string {
    return 'modele-factice';
  }

  async complete(request: LlmCompletionRequest) {
    fakeLlm.calls += 1;
    if (fakeLlm.failing) {
      return failure({ kind: 'api_error' as const, httpStatus: 400 });
    }
    const isIncluded = request.prompt.includes('Partie 4');
    return success({
      completed: true,
      text: JSON.stringify({
        isIncluded,
        parties: isIncluded ? ['diagnostic', 'objectifs'] : [],
        sectionTitle: isIncluded
          ? 'Partie 4 – Plan local de chaleur et de froid'
          : '',
        // La page 42 n'existe pas : elle ne doit pas être retenue.
        pages: isIncluded ? ['1', '42'] : [],
        justification: isIncluded
          ? 'Partie dédiée au PLCF.'
          : 'Simple mention.',
      }),
      usage: { ...emptyTokenUsage(), promptTokens: 100, totalTokens: 120 },
    });
  }
}

describe('Détection du PLCF dans les pièces déposées', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let service: DetectDocumentInclusionService;
  const queued: DetectDocumentInclusionJobData[] = [];
  const contenus = new Map<string, Buffer>();

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(DetectDocumentInclusionWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder
          .overrideProvider(getQueueToken(DETECT_DOCUMENT_INCLUSION_QUEUE_NAME))
          .useValue({
            add: async (
              _name: string,
              data: DetectDocumentInclusionJobData
            ) => {
              queued.push(data);
              return { id: 'fake-job' };
            },
          });
        moduleBuilder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new FakeLlmRepository()));
        moduleBuilder.overrideProvider(DocumentStorageService).useValue({
          downloadDocument: async ({ key }: { key: string }) => {
            const buffer = contenus.get(key);
            return buffer
              ? success({ buffer, mimeType: 'text/csv' })
              : failure('READ_DOCUMENT_ERROR');
          },
        });
      },
    });
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);
    service = app.get(DetectDocumentInclusionService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    queued.length = 0;
    fakeLlm.calls = 0;
    fakeLlm.failing = false;
  });

  /** Un EPCI qui compte une commune de plus de 45 000 habitants. */
  const createDemarcheAssujettie = () =>
    createDemarche(db, router, {
      collectivite: { population: 60000, natureInsee: 'CA' },
      communesMembres: [46000],
    });

  type Contexte = Awaited<ReturnType<typeof createDemarcheAssujettie>>;

  const deposer = async (
    { caller, collectiviteId, demarche }: Contexte,
    documentId: string,
    contenu: string
  ) => {
    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId,
      filename: `${documentId}.pdf`,
    });
    const [{ hash }] = await db.db
      .select({ hash: bibliothequeFichierTable.hash })
      .from(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.id, fichier.id));
    contenus.set(hash, Buffer.from(contenu));
    await caller.demarches.pcaet.documents.add({
      collectiviteId,
      demarcheId: demarche.id,
      documentId,
      fichierId: fichier.id,
    });
    return fichier;
  };

  const retirer = (
    { caller, collectiviteId, demarche }: Contexte,
    documentId: string
  ) =>
    caller.demarches.pcaet.documents.remove({
      collectiviteId,
      demarcheId: demarche.id,
      documentId,
    });

  const setCouverture = (
    { caller, collectiviteId, demarche }: Contexte,
    couvert: boolean
  ) =>
    caller.demarches.pcaet.documents.setCouverture({
      collectiviteId,
      demarcheId: demarche.id,
      documentId: PLCF,
      couvert,
    });

  /** Joue les analyses en attente, comme le ferait le worker. */
  const analyser = async () => {
    const jobs = queued.splice(0);
    const outcomes = [];
    for (const job of jobs) {
      const result = await service.detect(job);
      expect(result.success).toBe(true);
      outcomes.push(result.success ? result.data : null);
    }
    return outcomes;
  };

  const lister = ({ caller, collectiviteId, demarche }: Contexte) =>
    caller.demarches.pcaet.documents.list({
      collectiviteId,
      demarcheId: demarche.id,
    });

  const couvertureDuPlcf = (snapshot: DemarcheDocumentsSnapshot) =>
    computeDemarcheDocumentsCoverage(snapshot).find(
      ({ documentId }) => documentId === PLCF
    );

  const accueillants = (snapshot: DemarcheDocumentsSnapshot) => {
    const plcf = snapshot.definitions.find(({ id }) => id === PLCF);
    return plcf ? listDemarcheDocumentSubstitutsDeposes(plcf, snapshot) : [];
  };

  it('coche la case quand le diagnostic déposé contient une section dédiée au PLCF', async () => {
    const contexte = await createDemarcheAssujettie();
    await deposer(contexte, 'pcaet_diagnostic', AVEC_SECTION_PLCF);

    const enAttente = await lister(contexte);
    expect(enAttente.detections).toMatchObject([
      {
        documentId: 'pcaet_diagnostic',
        includedDocumentId: PLCF,
        status: 'pending',
      },
    ]);
    expect(couvertureDuPlcf(enAttente)?.couvert).toBe(false);

    expect(await analyser()).toEqual(['included']);

    const snapshot = await lister(contexte);
    expect(snapshot.detections).toMatchObject([
      {
        status: 'done',
        isIncluded: true,
        parties: ['diagnostic', 'objectifs'],
        sectionTitle: 'Partie 4 – Plan local de chaleur et de froid',
        pages: ['1'],
      },
    ]);
    expect(accueillants(snapshot)).toEqual(['pcaet_diagnostic']);
    expect(couvertureDuPlcf(snapshot)).toMatchObject({
      couvert: true,
      origine: 'substitut',
      substitutId: 'pcaet_diagnostic',
    });
    // La déclaration est écrite par le système, sans auteur.
    expect(
      snapshot.documents.find(({ documentId }) => documentId === PLCF)
        ?.modifiedBy
    ).toBeNull();
  });

  it('nomme tous les documents détectés, et garde la case tant qu’il en reste un', async () => {
    const contexte = await createDemarcheAssujettie();
    await deposer(contexte, 'pcaet_plan_actions', AVEC_SECTION_PLCF);
    await deposer(contexte, 'pcaet_diagnostic', AVEC_SECTION_PLCF);
    await deposer(contexte, 'pcaet_strategie_territoriale', MENTION_PLCF);
    await analyser();

    const complet = await lister(contexte);
    expect(accueillants(complet)).toEqual([
      'pcaet_diagnostic',
      'pcaet_plan_actions',
    ]);

    await retirer(contexte, 'pcaet_diagnostic');
    const sansDiagnostic = await lister(contexte);
    expect(
      sansDiagnostic.detections.map(({ documentId }) => documentId).sort()
    ).toEqual(['pcaet_plan_actions', 'pcaet_strategie_territoriale']);
    expect(accueillants(sansDiagnostic)).toEqual(['pcaet_plan_actions']);
    expect(couvertureDuPlcf(sansDiagnostic)?.couvert).toBe(true);

    await retirer(contexte, 'pcaet_plan_actions');
    const sansDetection = await lister(contexte);
    expect(accueillants(sansDetection)).toEqual([]);
    expect(couvertureDuPlcf(sansDetection)?.couvert).toBe(false);
    // La case est décochée : la déclaration a disparu.
    expect(
      sansDetection.documents.some(({ documentId }) => documentId === PLCF)
    ).toBe(false);
  });

  it('décochée pour un PLCF dédié, la case revient quand on retire ce fichier', async () => {
    const contexte = await createDemarcheAssujettie();
    await deposer(contexte, 'pcaet_diagnostic', AVEC_SECTION_PLCF);
    await analyser();

    await setCouverture(contexte, false);
    await deposer(contexte, PLCF, SANS_PLCF);
    expect(couvertureDuPlcf(await lister(contexte))?.origine).toBe('fichier');

    await retirer(contexte, PLCF);
    const apresRetrait = await lister(contexte);
    expect(couvertureDuPlcf(apresRetrait)?.couvert).toBe(false);
    expect(accueillants(apresRetrait)).toEqual(['pcaet_diagnostic']);

    await setCouverture(contexte, true);
    expect(couvertureDuPlcf(await lister(contexte))).toMatchObject({
      couvert: true,
      substitutId: 'pcaet_diagnostic',
    });
  });

  it('une simple mention ne coche rien, et la case ne peut pas être cochée', async () => {
    const contexte = await createDemarcheAssujettie();
    await deposer(contexte, 'pcaet_diagnostic', MENTION_PLCF);

    expect(await analyser()).toEqual(['not_included']);
    expect(fakeLlm.calls).toBe(1);

    const snapshot = await lister(contexte);
    expect(accueillants(snapshot)).toEqual([]);
    expect(couvertureDuPlcf(snapshot)?.couvert).toBe(false);
    await expect(setCouverture(contexte, true)).rejects.toThrow(
      'Cette pièce n’a été trouvée dans aucun des documents déposés : déposez un document dédié'
    );
  });

  it('n’interroge pas le modèle sur un document qui ne nomme jamais le sujet', async () => {
    const contexte = await createDemarcheAssujettie();
    await deposer(contexte, 'pcaet_diagnostic', SANS_PLCF);

    expect(await analyser()).toEqual(['not_included']);
    expect(fakeLlm.calls).toBe(0);
  });

  it('un échec de l’analyse ne coche rien', async () => {
    const contexte = await createDemarcheAssujettie();
    fakeLlm.failing = true;
    await deposer(contexte, 'pcaet_diagnostic', AVEC_SECTION_PLCF);

    expect(await analyser()).toEqual(['failed']);
    const snapshot = await lister(contexte);
    expect(snapshot.detections).toMatchObject([{ status: 'failed' }]);
    expect(couvertureDuPlcf(snapshot)?.couvert).toBe(false);
  });

  it('remplacer le fichier relance l’analyse, et retire la case si le nouveau ne contient plus le PLCF', async () => {
    const contexte = await createDemarcheAssujettie();
    await deposer(contexte, 'pcaet_diagnostic', AVEC_SECTION_PLCF);
    const [premiereAnalyse] = queued.splice(0);
    await deposer(contexte, 'pcaet_diagnostic', AVEC_SECTION_PLCF);
    await analyser();
    expect(couvertureDuPlcf(await lister(contexte))?.couvert).toBe(true);

    // Le job du premier fichier arrive en retard : il ne compte plus.
    expect(await service.detect(premiereAnalyse)).toEqual(success('skipped'));

    await deposer(contexte, 'pcaet_diagnostic', MENTION_PLCF);
    await analyser();
    const snapshot = await lister(contexte);
    expect(couvertureDuPlcf(snapshot)?.couvert).toBe(false);
    expect(
      snapshot.documents.some(({ documentId }) => documentId === PLCF)
    ).toBe(false);
  });

  it('ne cherche pas le PLCF chez une collectivité qui n’y est pas assujettie', async () => {
    const contexte = await createDemarche(db, router, {
      collectivite: { population: 60000, natureInsee: 'CA' },
      communesMembres: [30000],
    });
    await deposer(contexte, 'pcaet_diagnostic', AVEC_SECTION_PLCF);

    expect(queued).toEqual([]);
    const detections = await db.db
      .select()
      .from(demarcheDocumentDetectionTable)
      .where(
        eq(demarcheDocumentDetectionTable.demarcheId, contexte.demarche.id)
      );
    expect(detections).toEqual([]);
    expect(
      await db.db
        .select()
        .from(demarcheDocumentTable)
        .where(
          and(
            eq(demarcheDocumentTable.demarcheId, contexte.demarche.id),
            eq(demarcheDocumentTable.documentId, PLCF)
          )
        )
    ).toEqual([]);
  });
});
