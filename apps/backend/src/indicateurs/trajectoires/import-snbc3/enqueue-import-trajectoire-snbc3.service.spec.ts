import { Job, Queue } from 'bullmq';
import { EnqueueImportTrajectoireSnbc3Service } from './enqueue-import-trajectoire-snbc3.service';
import {
  IMPORT_TRAJECTOIRE_SNBC3_JOB_ID,
  ImportTrajectoireSnbc3JobData,
} from './import-trajectoire-snbc3.queue';
import { Snbc3ReleaseStorageService } from './snbc3-release-storage.service';

const input = { commit: 'a34a053', version: '2.1' };

const noPendingJobs = {
  active: 0,
  waiting: 0,
  delayed: 0,
  prioritized: 0,
};

const buildService = (queue: Partial<Record<keyof Queue, unknown>>) => {
  const storage = {
    getImportedRelease: vi.fn(),
  } as unknown as Snbc3ReleaseStorageService;
  return new EnqueueImportTrajectoireSnbc3Service(
    queue as unknown as Queue<ImportTrajectoireSnbc3JobData>,
    storage
  );
};

const job = (
  data: ImportTrajectoireSnbc3JobData,
  { timestamp = 1000, state = 'waiting' } = {}
) =>
  ({
    id: IMPORT_TRAJECTOIRE_SNBC3_JOB_ID,
    data,
    timestamp,
    getState: vi.fn().mockResolvedValue(state),
  } as unknown as Job<ImportTrajectoireSnbc3JobData>);

describe('EnqueueImportTrajectoireSnbc3Service', () => {
  test('met l’import en file sous l’id fixe', async () => {
    const added = job(input);
    const queue = {
      getJobCounts: vi.fn().mockResolvedValue(noPendingJobs),
      getJob: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValue(added),
      add: vi.fn().mockResolvedValue(added),
    };
    expect(await buildService(queue).enqueue(input)).toEqual({
      success: true,
      data: { jobId: IMPORT_TRAJECTOIRE_SNBC3_JOB_ID },
    });
    expect(queue.add).toHaveBeenCalledWith(expect.any(String), input, {
      jobId: IMPORT_TRAJECTOIRE_SNBC3_JOB_ID,
    });
  });

  test.each(['active', 'waiting'])(
    'refuse un import pendant un job %s, sans en ajouter',
    async (state) => {
      const queue = {
        getJobCounts: vi
          .fn()
          .mockResolvedValue({ ...noPendingJobs, [state]: 1 }),
        getJob: vi.fn(),
        add: vi.fn(),
      };
      expect(await buildService(queue).enqueue(input)).toMatchObject({
        success: false,
        error: 'SNBC3_IMPORT_ALREADY_RUNNING',
      });
      expect(queue.add).not.toHaveBeenCalled();
    }
  );

  test('refuse un import si le job à l’id fixe n’est pas terminé', async () => {
    const queue = {
      getJobCounts: vi.fn().mockResolvedValue(noPendingJobs),
      getJob: vi.fn().mockResolvedValue(job(input, { state: 'active' })),
      remove: vi.fn(),
      add: vi.fn(),
    };
    expect(await buildService(queue).enqueue(input)).toMatchObject({
      success: false,
      error: 'SNBC3_IMPORT_ALREADY_RUNNING',
    });
    expect(queue.remove).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  test('retire le job terminé du dernier import avant d’ajouter le suivant', async () => {
    const added = job(input, { timestamp: 2000 });
    const queue = {
      getJobCounts: vi.fn().mockResolvedValue(noPendingJobs),
      getJob: vi
        .fn()
        .mockResolvedValueOnce(job(input, { state: 'completed' }))
        .mockResolvedValue(added),
      remove: vi.fn().mockResolvedValue(1),
      add: vi.fn().mockResolvedValue(added),
    };
    expect(await buildService(queue).enqueue(input)).toMatchObject({
      success: true,
    });
    expect(queue.remove).toHaveBeenCalledWith(IMPORT_TRAJECTOIRE_SNBC3_JOB_ID);
  });

  test('refuse si un appel concurrent a mis son job en file', async () => {
    const queue = {
      getJobCounts: vi.fn().mockResolvedValue(noPendingJobs),
      getJob: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue(job({ ...input, version: '2.2' })),
      add: vi.fn().mockResolvedValue(job(input)),
    };
    expect(await buildService(queue).enqueue(input)).toMatchObject({
      success: false,
      error: 'SNBC3_IMPORT_ALREADY_RUNNING',
    });
  });

  test('renvoie SERVER_ERROR si la file échoue', async () => {
    const queue = {
      getJobCounts: vi.fn().mockRejectedValue(new Error('redis injoignable')),
    };
    expect(await buildService(queue).enqueue(input)).toMatchObject({
      success: false,
      error: 'SERVER_ERROR',
    });
  });

  test('renvoie SERVER_ERROR si BullMQ n’attribue pas d’id', async () => {
    const queue = {
      getJobCounts: vi.fn().mockResolvedValue(noPendingJobs),
      getJob: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue({ ...job(input), id: undefined }),
    };
    expect(await buildService(queue).enqueue(input)).toMatchObject({
      success: false,
      error: 'SERVER_ERROR',
    });
  });
});
