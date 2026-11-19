import { TRPCClientError } from '@trpc/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// `vi.mock` est remonté en tête du module : les doublures doivent l'être aussi.
const { getCollectivite, canVisitAsInstructeur, getUser, notFound, request } =
  vi.hoisted(() => ({
    getCollectivite: vi.fn(),
    canVisitAsInstructeur: vi.fn(),
    getUser: vi.fn(),
    notFound: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND');
    }),
    request: { path: '', cookies: {} as Record<string, string> },
  }));

vi.mock('server-only', () => ({}));
vi.mock('@tet/api/collectivites/index.server', () => ({
  getCollectivite,
  canVisitAsInstructeur,
}));
vi.mock('@tet/api/users/user-details.fetch.server', () => ({ getUser }));
vi.mock('next/navigation', () => ({ notFound }));
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
    canVisitAsInstructeur.mockReset().mockResolvedValue(false);
    getUser.mockReset().mockResolvedValue({ collectivites: [] });
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
   * Une saisine close ou des droits retirés : le cookie est effacé, et la
   * collectivité est rendue sans dossier — pas de repli sur la saisine la plus
   * récente, qui afficherait une bannière sans passage par le dossier.
   */
  test('rend la collectivité sans dossier quand le dossier mémorisé ne résout plus rien', async () => {
    request.cookies = { tet_dossier_instruction_4147: '41' };
    getCollectivite.mockResolvedValue({ contexteInstruction: null });

    await expect(getCollectiviteForRequest(4147)).resolves.toEqual({
      collectivite: { contexteInstruction: null },
      demandeAvisId: undefined,
      demarcheId: undefined,
      isRememberedDossierStale: true,
      isVisitAllowedByInstruction: false,
    });
    expect(getCollectivite).toHaveBeenCalledOnce();
  });

  test('ne retente rien quand le dossier de la route ne résout rien', async () => {
    request.path = '/collectivite/4147/instruction/41';
    getCollectivite.mockResolvedValue({ contexteInstruction: null });

    await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
      isRememberedDossierStale: false,
    });
    expect(getCollectivite).toHaveBeenCalledOnce();
  });

  describe('accès par saisine', () => {
    beforeEach(() => {
      getCollectivite.mockResolvedValue({ contexteInstruction: null });
    });

    test('est acquis quand un dossier est désigné et résolu', async () => {
      getCollectivite.mockResolvedValue({ contexteInstruction: CONTEXTE });
      request.path = '/collectivite/4147/instruction/41';

      await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
        isVisitAllowedByInstruction: true,
      });
      expect(canVisitAsInstructeur).not.toHaveBeenCalled();
    });

    test('ouvre la collectivité à un non-membre qu’une saisine couvre, sans contexte', async () => {
      canVisitAsInstructeur.mockResolvedValue(true);

      await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
        collectivite: { contexteInstruction: null },
        isVisitAllowedByInstruction: true,
      });
      expect(canVisitAsInstructeur).toHaveBeenCalledExactlyOnceWith(4147);
    });

    test('reste fermé à un non-membre sans saisine', async () => {
      await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
        isVisitAllowedByInstruction: false,
      });
    });

    test('n’est pas demandé pour un membre', async () => {
      getUser.mockResolvedValue({ collectivites: [{ collectiviteId: 4147 }] });

      await expect(getCollectiviteForRequest(4147)).resolves.toMatchObject({
        isVisitAllowedByInstruction: false,
      });
      expect(canVisitAsInstructeur).not.toHaveBeenCalled();
    });
  });

  test('affiche une 404 quand la collectivité du lien est absente', async () => {
    request.path = '/collectivite/319/actions/17642/details';
    getCollectivite.mockRejectedValue(apiError('NOT_FOUND'));

    await expect(getCollectiviteForRequest(319)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });

  test.each([
    apiError('FORBIDDEN'),
    apiError('INTERNAL_SERVER_ERROR'),
    new Error('Connexion interrompue'),
  ])('ne transforme pas une autre erreur en 404 : %s', async (error) => {
    getCollectivite.mockRejectedValue(error);

    await expect(getCollectiviteForRequest(4147)).rejects.toBe(error);
    expect(notFound).not.toHaveBeenCalled();
  });
});
