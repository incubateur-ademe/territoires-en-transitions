import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAndSaveDocument } from './fetch-and-save-document';

const { saveBlob } = vi.hoisted(() => ({ saveBlob: vi.fn() }));

vi.mock('@/app/utils/save-blob', () => ({ saveBlob }));

const url = 'https://example.org/signed/note.pdf';
const filename = 'note.pdf';
const fileBytes = new Blob(['des octets']);

const stubFetchResponse = (response: Partial<Response>) => {
  const fetch = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

describe('fetchAndSaveDocument', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    saveBlob.mockReset();
  });

  it("sauvegarde sous le nom du document les octets lus à l'url signée", async () => {
    const fetch = stubFetchResponse({
      ok: true,
      blob: () => Promise.resolve(fileBytes),
    });

    await fetchAndSaveDocument({ url, filename });

    expect(fetch).toHaveBeenCalledWith(url);
    expect(saveBlob).toHaveBeenCalledWith(fileBytes, filename);
  });

  it("échoue sur un statut HTTP en erreur, au lieu de sauvegarder la page d'erreur", async () => {
    stubFetchResponse({
      ok: false,
      status: 403,
      blob: () => Promise.resolve(fileBytes),
    });

    await expect(fetchAndSaveDocument({ url, filename })).rejects.toThrow(
      'HTTP 403'
    );
    expect(saveBlob).not.toHaveBeenCalled();
  });
});
