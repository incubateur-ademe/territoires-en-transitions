import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { DocumentStorageErrorEnum } from '@tet/backend/utils/supabase/document-storage.errors';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { Queue } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import {
  AiPlanImportJobRepository,
  CreateJobInput,
} from '../ai-plan-import-job.repository';
import { AiPlanImportErrorEnum } from '../ai-plan-import.errors';
import { AiPlanImportJobData } from '../ai-plan-import.queue';
import {
  AiPlanImportJob,
  AiPlanImportJobOptions,
  AiPlanImportJobStatusEnum,
} from '../models/ai-plan-import-job';
import { initialStepStates } from '../generate-import-draft/run-import-pipeline';
import { EnqueueImportService } from './enqueue-import.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const options: AiPlanImportJobOptions = {
  instructions: '',
  withVerifications: true,
  withSousActions: true,
  disabledFields: [],
};

const job: AiPlanImportJob = {
  id: 'job-1',
  collectiviteId: 10,
  createdBy: 'user-1',
  status: AiPlanImportJobStatusEnum.PENDING,
  options,
  stepStates: initialStepStates(),
  sourcePath: '10/abc',
  draft: null,
  error: null,
  createdAt: '2026-06-11T00:00:00Z',
  modifiedAt: '2026-06-11T00:00:00Z',
};

const toCsvFile = () => {
  const buffer = Buffer.from('axe,titre\n1,Action', 'utf-8');
  return { buffer, mimeType: 'text/csv', size: buffer.length };
};

const toPdfDeclaredAsCsv = () => {
  const buffer = Buffer.from('%PDF-1.7\ncontenu', 'utf-8');
  return { buffer, mimeType: 'text/csv', size: buffer.length };
};

const toBinaryDeclaredAsCsv = () => {
  const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
  return { buffer, mimeType: 'text/csv', size: buffer.length };
};

const toTruncatedZip = () => {
  const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  return { buffer, mimeType: 'application/octet-stream', size: buffer.length };
};

const toXlsxBomb = () => {
  const entries = [
    { name: '[Content_Types].xml', uncompressedBytes: 100 },
    { name: 'xl/sharedStrings.xml', uncompressedBytes: 4_000_000_000 },
  ];
  const localStub = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const directory = Buffer.concat(
    entries.map(({ name, uncompressedBytes }) => {
      const nameBuffer = Buffer.from(name, 'utf-8');
      const header = Buffer.alloc(46);
      header.writeUInt32LE(0x02014b50, 0);
      header.writeUInt32LE(uncompressedBytes, 24);
      header.writeUInt16LE(nameBuffer.length, 28);
      return Buffer.concat([header, nameBuffer]);
    })
  );
  const endOfDirectory = Buffer.alloc(22);
  endOfDirectory.writeUInt32LE(0x06054b50, 0);
  endOfDirectory.writeUInt16LE(entries.length, 10);
  endOfDirectory.writeUInt32LE(directory.length, 12);
  endOfDirectory.writeUInt32LE(localStub.length, 16);
  const buffer = Buffer.concat([localStub, directory, endOfDirectory]);
  return { buffer, mimeType: 'application/octet-stream', size: buffer.length };
};

type MockOverrides = {
  isAllowed?: boolean;
  countInFlight?: number;
  createUnlessInFlight?: () => Promise<unknown>;
  storeDocument?: () => Promise<unknown>;
  queueAdd?: () => Promise<unknown>;
};

const buildService = (overrides: MockOverrides = {}) => {
  const isAllowed = vi.fn(async () => overrides.isAllowed ?? true);
  const permissions = { isAllowed } as unknown as PermissionService;

  const createUnlessInFlight = vi.fn<
    (input: CreateJobInput) => Promise<unknown>
  >(overrides.createUnlessInFlight ?? (async () => success(job)));
  const deleteIfPending = vi.fn(async () => success(undefined));
  const jobRepository = {
    countInFlight: vi.fn(async () => success(overrides.countInFlight ?? 0)),
    createUnlessInFlight,
    deleteIfPending,
  } as unknown as AiPlanImportJobRepository;

  const storeDocument = vi.fn<
    (
      input: Parameters<DocumentStorageService['storeDocument']>[0]
    ) => Promise<unknown>
  >(overrides.storeDocument ?? (async () => success({ key: 'stored' })));
  const removeDocument = vi.fn(async () => success(undefined));
  const documentStorage = {
    storeDocument,
    removeDocument,
  } as unknown as DocumentStorageService;

  const add = vi.fn(overrides.queueAdd ?? (async () => undefined));
  const queue = { add } as unknown as Queue<AiPlanImportJobData>;

  const service = new EnqueueImportService(
    permissions,
    jobRepository,
    documentStorage,
    queue
  );

  return {
    service,
    createUnlessInFlight,
    deleteIfPending,
    storeDocument,
    removeDocument,
    add,
  };
};

describe('EnqueueImportService', () => {
  it('retourne le jobId et enfile avec le même id en clé de dédup BullMQ', async () => {
    const { service, add } = buildService();

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toCsvFile(),
      options,
    });

    expect(result).toEqual({ success: true, data: { jobId: 'job-1' } });
    expect(add).toHaveBeenCalledWith(
      'generate-import-draft',
      { jobId: 'job-1' },
      { jobId: 'job-1' }
    );
  });

  it('écrit le même sourcePath dans la ligne du job et dans le storage', async () => {
    const { service, createUnlessInFlight, storeDocument } = buildService();

    await service.enqueue({
      collectiviteId: 10,
      user,
      file: toCsvFile(),
      options,
    });

    const createdWith = createUnlessInFlight.mock.calls[0][0];
    expect(createdWith.sourcePath).toMatch(/^10\//);
    expect(storeDocument).toHaveBeenCalledWith(
      expect.objectContaining({ key: createdWith.sourcePath })
    );
  });

  it('stocke avec le mime détecté dans le contenu, pas le mime déclaré', async () => {
    const { service, storeDocument } = buildService();

    await service.enqueue({
      collectiviteId: 10,
      user,
      file: toPdfDeclaredAsCsv(),
      options,
    });

    expect(storeDocument).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'application/pdf' })
    );
  });

  it('refuse sans permission et sans aucun effet de bord', async () => {
    const { service, createUnlessInFlight, storeDocument, add } = buildService({
      isAllowed: false,
    });

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toCsvFile(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.UNAUTHORIZED,
    });
    expect(createUnlessInFlight).not.toHaveBeenCalled();
    expect(storeDocument).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('refuse un binaire déclaré csv sans aucun effet de bord', async () => {
    const { service, createUnlessInFlight, storeDocument, add } = buildService();

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toBinaryDeclaredAsCsv(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.UNSUPPORTED_FILE_TYPE,
    });
    expect(createUnlessInFlight).not.toHaveBeenCalled();
    expect(storeDocument).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('mappe un zip sans structure xlsx sur UNSUPPORTED_FILE_TYPE', async () => {
    const { service } = buildService();

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toTruncatedZip(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.UNSUPPORTED_FILE_TYPE,
    });
  });

  it('mappe un xlsx déclarant plus de 100 Mo décompressés sur FILE_TOO_LARGE', async () => {
    const { service } = buildService();

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toXlsxBomb(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.FILE_TOO_LARGE,
    });
  });

  it('refuse au-delà de 20 jobs in-flight sans créer de ligne', async () => {
    const { service, createUnlessInFlight } = buildService({
      countInFlight: 20,
    });

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toCsvFile(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.TOO_MANY_IN_FLIGHT_JOBS,
    });
    expect(createUnlessInFlight).not.toHaveBeenCalled();
  });

  it('propage le conflit in-flight sans toucher storage ni queue', async () => {
    const { service, storeDocument, add } = buildService({
      createUnlessInFlight: async () =>
        failure(AiPlanImportErrorEnum.IN_FLIGHT_JOB_EXISTS),
    });

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toCsvFile(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.IN_FLIGHT_JOB_EXISTS,
    });
    expect(storeDocument).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it("supprime la ligne pending quand l'upload storage échoue", async () => {
    const { service, deleteIfPending, removeDocument, add } = buildService({
      storeDocument: async () =>
        failure(DocumentStorageErrorEnum.WRITE_DOCUMENT_ERROR),
    });

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toCsvFile(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.STORAGE_ERROR,
    });
    expect(deleteIfPending).toHaveBeenCalledWith('job-1');
    expect(removeDocument).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it("supprime l'objet storage puis la ligne quand la mise en file d'attente échoue", async () => {
    const { service, deleteIfPending, removeDocument, storeDocument } =
      buildService({
        queueAdd: async () => {
          throw new Error('redis down');
        },
      });

    const result = await service.enqueue({
      collectiviteId: 10,
      user,
      file: toCsvFile(),
      options,
    });

    expect(result).toEqual({
      success: false,
      error: AiPlanImportErrorEnum.CREATE_JOB_ERROR,
    });
    const storedKey = storeDocument.mock.calls[0][0].key;
    expect(removeDocument).toHaveBeenCalledWith({
      bucketId: 'ai-plan-import-sources',
      key: storedKey,
    });
    expect(deleteIfPending).toHaveBeenCalledWith('job-1');
    expect(removeDocument.mock.invocationCallOrder[0]).toBeLessThan(
      deleteIfPending.mock.invocationCallOrder[0]
    );
  });
});
