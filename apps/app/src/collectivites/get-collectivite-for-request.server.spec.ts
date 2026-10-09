import { beforeEach, describe, expect, test, vi } from 'vitest';

// `vi.mock` est remonté en tête du module : les doublures doivent l'être aussi.
const { getCollectivite, request } = vi.hoisted(() => ({
  getCollectivite: vi.fn(),
  request: { path: '', cookies: {} as Record<string, string> },
}));

vi.mock('server-only', () => ({}));
vi.mock('@tet/api/collectivites/index.server', () => ({ getCollectivite }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-current-path': request.path }),
  cookies: async () => ({
    get: (name: string) =>
      name in request.cookies ? { value: request.cookies[name] } : undefined,
  }),
}));

import { getCollectiviteForRequest } from './get-collectivite-for-request.server';

const CONTEXTE = { demandeAvisId: 41 };

describe('getCollectiviteForRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    request.path = '/collectivite/4147/plans';
    request.cookies = {};
    getCollectivite.mockResolvedValue({ contexteInstruction: CONTEXTE });
  });

  test('prend le dossier de la route, et ignore alors le cookie', async () => {
    request.path = '/collectivite/4147/instruction/41';
    request.cookies = { tet_dossier_instruction_4147: '99' };

    await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
      demandeAvisId: 41,
      isRememberedDossierStale: false,
    });
    expect(getCollectivite).toHaveBeenCalledExactlyOnceWith(
      4147,
      41,
      undefined
    );
  });

  test('hors route de dossier, reprend le dossier mémorisé de la collectivité', async () => {
    request.cookies = { tet_dossier_instruction_4147: 'demarche:12' };

    await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
      demarcheId: 12,
      isRememberedDossierStale: false,
    });
    expect(getCollectivite).toHaveBeenCalledExactlyOnceWith(
      4147,
      undefined,
      12
    );
  });

  test('ignore le dossier mémorisé d’une autre collectivité', async () => {
    request.cookies = { tet_dossier_instruction_5556: '41' };

    await getCollectiviteForRequest(4147);
    expect(getCollectivite).toHaveBeenCalledExactlyOnceWith(
      4147,
      undefined,
      undefined
    );
  });

  /**
   * Une saisine close ou des droits retirés : un non-membre doit retrouver la
   * saisine la plus récente, qui lui ouvre la collectivité.
   */
  test('retombe sur le contexte par défaut quand le dossier mémorisé ne résout plus rien', async () => {
    request.cookies = { tet_dossier_instruction_4147: '41' };
    getCollectivite
      .mockResolvedValueOnce({ contexteInstruction: null })
      .mockResolvedValueOnce({ contexteInstruction: { demandeAvisId: 50 } });

    await expect(getCollectiviteForRequest(4147)).resolves.toEqual({
      collectivite: { contexteInstruction: { demandeAvisId: 50 } },
      demandeAvisId: undefined,
      demarcheId: undefined,
      isRememberedDossierStale: true,
    });
    expect(getCollectivite).toHaveBeenLastCalledWith(4147);
  });

  test('ne retente rien quand le dossier de la route ne résout rien', async () => {
    request.path = '/collectivite/4147/instruction/41';
    getCollectivite.mockResolvedValue({ contexteInstruction: null });

    await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
      isRememberedDossierStale: false,
    });
    expect(getCollectivite).toHaveBeenCalledOnce();
  });
});
