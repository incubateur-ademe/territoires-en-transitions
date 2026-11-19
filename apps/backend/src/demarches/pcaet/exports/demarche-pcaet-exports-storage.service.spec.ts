import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  DemarchePcaetExportsStorageService,
  STORAGE_UPLOAD_TIMEOUT_MS,
} from './demarche-pcaet-exports-storage.service';

type SaveResult = Awaited<ReturnType<SupabaseService['saveInStorage']>>;

const saved: SaveResult = {
  success: true,
  data: { id: 'id', path: 'path', fullPath: 'fullPath' },
};
const notSaved: SaveResult = { success: false, error: 'UPLOAD_STORAGE_ERROR' };

/** Promesse résolue à la main, pour un envoi qui aboutit quand on le décide. */
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const buildService = (saveInStorage: (path: string) => Promise<SaveResult>) => {
  const remove = vi.fn().mockResolvedValue({ data: [], error: null });
  const supabase = {
    ensurePrivateBucket: vi
      .fn()
      .mockResolvedValue({ success: true, data: undefined }),
    saveInStorage: vi.fn(({ path }: { path: string }) => saveInStorage(path)),
    client: { storage: { from: () => ({ remove }) } },
  };
  const service = new DemarchePcaetExportsStorageService(
    supabase as unknown as SupabaseService
  );
  return { service, supabase, remove };
};

const files = [
  { path: '1/publier/essai/plan.xlsx', content: Buffer.from('plan') },
  { path: '1/publier/essai/indicateurs.xlsx', content: Buffer.from('ind') },
];

describe('DemarchePcaetExportsStorageService.store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('écrit sans remplacement possible et ne retire rien quand tout passe', async () => {
    const { service, supabase, remove } = buildService(async () => saved);

    const result = await service.store(files);

    expect(result.success).toBe(true);
    expect(supabase.saveInStorage).toHaveBeenCalledWith(
      expect.objectContaining({ upsert: false })
    );
    await vi.runAllTimersAsync();
    expect(remove).not.toHaveBeenCalled();
  });

  test("retire l'objet écrit d'un essai dont un autre envoi a échoué", async () => {
    const { service, remove } = buildService(async (path) =>
      path.endsWith('plan.xlsx') ? saved : notSaved
    );

    const result = await service.store(files);

    expect(result.success).toBe(false);
    await vi.runAllTimersAsync();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(['1/publier/essai/plan.xlsx']);
  });

  test("retire l'objet d'un envoi qui aboutit après le délai", async () => {
    const lent = deferred<SaveResult>();
    const { service, remove } = buildService((path) =>
      path.endsWith('plan.xlsx') ? lent.promise : Promise.resolve(saved)
    );

    const pending = service.store(files);
    await vi.advanceTimersByTimeAsync(STORAGE_UPLOAD_TIMEOUT_MS);
    const result = await pending;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.cause?.message).toContain('STORAGE_TIMEOUT');
    }
    // L'envoi rapide est déjà retiré ; le lent ne l'est pas encore.
    await vi.runAllTimersAsync();
    expect(remove).toHaveBeenCalledWith(['1/publier/essai/indicateurs.xlsx']);
    expect(remove).not.toHaveBeenCalledWith(['1/publier/essai/plan.xlsx']);

    lent.resolve(saved);
    await vi.runAllTimersAsync();
    expect(remove).toHaveBeenCalledWith(['1/publier/essai/plan.xlsx']);
  });

  test('un retrait en erreur est journalisé sans lever', async () => {
    const { service, remove } = buildService(async (path) =>
      path.endsWith('plan.xlsx') ? saved : notSaved
    );
    remove.mockResolvedValue({ data: null, error: new Error('remove KO') });

    await expect(service.store(files)).resolves.toMatchObject({
      success: false,
    });
    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    expect(remove).toHaveBeenCalled();
  });
});
