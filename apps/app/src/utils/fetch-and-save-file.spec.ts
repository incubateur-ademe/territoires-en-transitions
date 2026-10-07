import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAndSaveFile } from './fetch-and-save-file';

const { saveBlob } = vi.hoisted(() => ({ saveBlob: vi.fn() }));

vi.mock('@/app/utils/save-blob', () => ({ saveBlob }));

const url = 'https://example.org/rapport.pdf';
const filename = 'rapport.pdf';
const fileBytes = new Blob(['des octets']);

const stubFetchResponse = (response: Partial<Response>) => {
  const fetch = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

describe('fetchAndSaveFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    saveBlob.mockReset();
  });

  it('sauvegarde les octets lus sous le nom demandé', async () => {
    const fetch = stubFetchResponse({
      ok: true,
      blob: () => Promise.resolve(fileBytes),
    });

    await fetchAndSaveFile({ url, filename });

    expect(fetch).toHaveBeenCalledWith(url);
    expect(saveBlob).toHaveBeenCalledWith(fileBytes, filename);
  });

  it("échoue sur un statut HTTP en erreur, au lieu de sauvegarder la page d'erreur", async () => {
    stubFetchResponse({
      ok: false,
      status: 403,
      blob: () => Promise.resolve(fileBytes),
    });

    await expect(fetchAndSaveFile({ url, filename })).rejects.toThrow(
      'HTTP 403'
    );
    expect(saveBlob).not.toHaveBeenCalled();
  });
});
