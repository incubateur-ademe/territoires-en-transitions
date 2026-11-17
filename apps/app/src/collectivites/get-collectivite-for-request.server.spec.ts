import { TRPCClientError } from '@trpc/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// `vi.mock` est remonté en tête du module : les doublures doivent l'être aussi.
const {
  getCollectivite,
  fetchQuery,
  queryOptions,
  notFound,
  redirect,
  request,
} = vi.hoisted(() => ({
  getCollectivite: vi.fn(),
  fetchQuery: vi.fn(),
  queryOptions: vi.fn((input: { id: number }) => ({
    queryKey: ['fiche', input.id],
  })),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  request: { path: '', cookies: {} as Record<string, string> },
}));

vi.mock('server-only', () => ({}));
vi.mock('@tet/api/collectivites/index.server', () => ({ getCollectivite }));
vi.mock('@tet/api/utils/trpc/trpc-server-client', () => ({
  getQueryClient: () => ({ fetchQuery }),
  trpcInServerComponent: { plans: { fiches: { get: { queryOptions } } } },
}));
vi.mock('next/navigation', () => ({ notFound, redirect }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-current-path': request.path }),
  cookies: async () => ({
    get: (name: string) =>
      name in request.cookies ? { value: request.cookies[name] } : undefined,
  }),
}));

import { getCollectiviteForRequest } from './get-collectivite-for-request.server';

const CONTEXTE = { demandeAvisId: 41 };
const apiError = (code: 'NOT_FOUND' | 'FORBIDDEN' | 'INTERNAL_SERVER_ERROR') =>
  TRPCClientError.from({
    error: { code: -32004, message: code, data: { code } },
  });

describe('getCollectiviteForRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    request.path = '/collectivite/4147/plans';
    request.cookies = {};
    getCollectivite
      .mockReset()
      .mockResolvedValue({ contexteInstruction: CONTEXTE });
    fetchQuery.mockReset().mockResolvedValue({ collectiviteId: 5499 });
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

  test('conserve le contexte existant pour une fiche partagée', async () => {
    request.path = '/collectivite/4147/actions/17642/details';

    await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
      collectivite: { contexteInstruction: CONTEXTE },
    });
    expect(fetchQuery).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  test.each([
    [
      '/collectivite/319/actions/17642/details',
      '/collectivite/5499/actions/17642/details',
    ],
    [
      '/collectivite/319/actions/17642',
      '/collectivite/5499/actions/17642/details',
    ],
    [
      '/collectivite/319/actions/17642/documents?planId=42&onglet=liens',
      '/collectivite/5499/actions/17642/documents?planId=42&onglet=liens',
    ],
  ])('redirige la fiche déplacée depuis %s', async (path, destination) => {
    request.path = path;
    getCollectivite.mockRejectedValue(apiError('NOT_FOUND'));

    await expect(getCollectiviteForRequest(319)).rejects.toThrow(
      `NEXT_REDIRECT:${destination}`
    );
    expect(queryOptions).toHaveBeenCalledExactlyOnceWith({ id: 17642 });
    expect(redirect).toHaveBeenCalledExactlyOnceWith(destination);
    expect(notFound).not.toHaveBeenCalled();
  });

  test.each([
    '/collectivite/319/tableau-de-bord/synthetique',
    '/collectivite/320/actions/17642/details',
    '/collectivite/319/actions/17642/onglet-inconnu',
    '/collectivite/319/actions/9007199254740993/details',
  ])('affiche une 404 sans rechercher de fiche pour %s', async (path) => {
    request.path = path;
    getCollectivite.mockRejectedValue(apiError('NOT_FOUND'));

    await expect(getCollectiviteForRequest(319)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(fetchQuery).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  test.each(['NOT_FOUND', 'FORBIDDEN'] as const)(
    'ne révèle pas la destination si la fiche renvoie %s',
    async (code) => {
      request.path = '/collectivite/319/actions/17642/details';
      getCollectivite.mockRejectedValue(apiError('NOT_FOUND'));
      fetchQuery.mockRejectedValue(apiError(code));

      await expect(getCollectiviteForRequest(319)).rejects.toThrow(
        'NEXT_NOT_FOUND'
      );
      expect(redirect).not.toHaveBeenCalled();
    }
  );

  test('ne boucle pas si la fiche référence encore la collectivité absente', async () => {
    request.path = '/collectivite/319/actions/17642/details';
    getCollectivite.mockRejectedValue(apiError('NOT_FOUND'));
    fetchQuery.mockResolvedValue({ collectiviteId: 319 });

    await expect(getCollectiviteForRequest(319)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(redirect).not.toHaveBeenCalled();
  });

  test('ne transforme pas une panne de collectivité en redirection ou en 404', async () => {
    request.path = '/collectivite/319/actions/17642/details';
    const error = apiError('INTERNAL_SERVER_ERROR');
    getCollectivite.mockRejectedValue(error);

    await expect(getCollectiviteForRequest(319)).rejects.toBe(error);
    expect(fetchQuery).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });

  test('ne masque pas une panne pendant la recherche de la fiche', async () => {
    request.path = '/collectivite/319/actions/17642/details';
    const error = apiError('INTERNAL_SERVER_ERROR');
    getCollectivite.mockRejectedValue(apiError('NOT_FOUND'));
    fetchQuery.mockRejectedValue(error);

    await expect(getCollectiviteForRequest(319)).rejects.toBe(error);
    expect(notFound).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
