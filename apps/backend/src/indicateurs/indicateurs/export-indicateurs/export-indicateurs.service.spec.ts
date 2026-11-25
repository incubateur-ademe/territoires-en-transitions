import { NotFoundException } from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import ExportIndicateursService from './export-indicateurs.service';

const EMPTY_LIST = success({ count: 0, data: [] });

const toService = ({
  canReadConfidentiel,
  listIndicateurs,
  getCollectivite = vi.fn(),
  getIndicateursValeurs = vi.fn(),
}: {
  canReadConfidentiel: boolean;
  listIndicateurs: ReturnType<typeof vi.fn>;
  getCollectivite?: ReturnType<typeof vi.fn>;
  getIndicateursValeurs?: ReturnType<typeof vi.fn>;
}) =>
  new ExportIndicateursService(
    {
      isAllowed: vi
        .fn()
        .mockResolvedValue(
          canReadConfidentiel ? success(undefined) : failure('UNAUTHORIZED')
        ),
    } as never,
    { getIndicateursValeurs } as never,
    { getCollectivite } as never,
    { listIndicateurs } as never,
    {} as never,
    {} as never
  );

const exportSelection = (service: ExportIndicateursService) =>
  service.exportXLSX(
    { collectiviteId: 1, mode: 'selection', indicateurIds: [1] } as never,
    { id: 'user' } as never
  );

const filtersOfCall = (
  listIndicateurs: ReturnType<typeof vi.fn>,
  callIndex: number
) => listIndicateurs.mock.calls[callIndex][0].filters;

describe('ExportIndicateursService : indicateurs confidentiels', () => {
  it('exclut, sans droit sur les confidentiels, les indicateurs confidentiels et ceux dont un ancêtre l’est', async () => {
    const listIndicateurs = vi.fn().mockResolvedValue(EMPTY_LIST);
    const service = toService({ canReadConfidentiel: false, listIndicateurs });

    await exportSelection(service);

    expect(filtersOfCall(listIndicateurs, 0)).toMatchObject({
      estConfidentiel: false,
      sansAncetreConfidentiel: true,
    });
  });

  it('applique la même exclusion aux sous-indicateurs ajoutés à l’export sans droit sur les confidentiels', async () => {
    const listIndicateurs = vi
      .fn()
      .mockResolvedValueOnce(
        success({
          count: 1,
          data: [{ id: 1, enfants: [{ id: 2 }] }],
        })
      )
      .mockResolvedValueOnce(EMPTY_LIST);
    const service = toService({ canReadConfidentiel: false, listIndicateurs });

    await exportSelection(service);

    expect(filtersOfCall(listIndicateurs, 1)).toMatchObject({
      indicateurIds: [2],
      estConfidentiel: false,
      sansAncetreConfidentiel: true,
    });
  });

  it('ne filtre rien avec le droit sur les confidentiels', async () => {
    const listIndicateurs = vi.fn().mockResolvedValue(EMPTY_LIST);
    const service = toService({ canReadConfidentiel: true, listIndicateurs });

    await exportSelection(service);

    const filters = filtersOfCall(listIndicateurs, 0);
    expect(filters.estConfidentiel).toBeUndefined();
    expect(filters.sansAncetreConfidentiel).toBeUndefined();
  });
});

describe('ExportIndicateursService : échecs', () => {
  it('retourne un succès sans contenu quand aucun indicateur n’est exportable', async () => {
    const listIndicateurs = vi.fn().mockResolvedValue(EMPTY_LIST);

    const result = await exportSelection(
      toService({ canReadConfidentiel: true, listIndicateurs })
    );

    expect(result).toEqual(success(null));
  });

  it.each([
    ['UNAUTHORIZED', 'Droits insuffisants'],
    ['INDICATEUR_NOT_FOUND', 'Indicateur not found for id 1'],
    ['DATABASE_ERROR', 'lecture impossible'],
  ] as const)(
    'propage l’échec %s de la liste avec sa cause',
    async (error, message) => {
      const cause = new Error(message);
      const listIndicateurs = vi.fn().mockResolvedValue(failure(error, cause));

      const result = await exportSelection(
        toService({ canReadConfidentiel: true, listIndicateurs })
      );

      expect(result).toEqual(failure(error, cause));
    }
  );

  it('propage le refus d’une clé d’API avec son message exact', async () => {
    const cause = new Error(
      "Droits insuffisants, la clé d'api n'a pas l'autorisation indicateurs.indicateurs.read."
    );
    const listIndicateurs = vi
      .fn()
      .mockResolvedValue(failure('UNAUTHORIZED', cause));

    const result = await exportSelection(
      toService({ canReadConfidentiel: true, listIndicateurs })
    );

    expect(result).toEqual(failure('UNAUTHORIZED', cause));
  });

  it('refuse un export au-delà de la limite technique, sans rien lire d’autre', async () => {
    const listIndicateurs = vi
      .fn()
      .mockResolvedValue(success({ count: 5001, data: [{ id: 1 }] }));
    const getCollectivite = vi.fn();

    const result = await exportSelection(
      toService({ canReadConfidentiel: true, listIndicateurs, getCollectivite })
    );

    expect(result).toEqual(
      failure(
        'EXPORT_TOO_LARGE',
        new Error("L'export dépasse la limite technique de 5000 indicateurs")
      )
    );
    expect(getCollectivite).not.toHaveBeenCalled();
  });

  it('propage une collectivité introuvable avec son exception d’origine', async () => {
    const cause = new NotFoundException('Collectivité introuvable');
    const listIndicateurs = vi
      .fn()
      .mockResolvedValue(success({ count: 1, data: [{ id: 1 }] }));
    const getCollectivite = vi
      .fn()
      .mockResolvedValue(failure('NOT_FOUND', cause));

    const result = await exportSelection(
      toService({ canReadConfidentiel: true, listIndicateurs, getCollectivite })
    );

    expect(result).toEqual(failure('NOT_FOUND', cause));
  });

  it('convertit un échec de lecture des valeurs en DATABASE_ERROR en gardant sa cause', async () => {
    const cause = new Error('valeurs illisibles');
    const listIndicateurs = vi.fn().mockResolvedValue(
      success({
        count: 1,
        data: [{ id: 1, identifiantReferentiel: null, titre: 'Titre' }],
      })
    );
    const getCollectivite = vi
      .fn()
      .mockResolvedValue(success({ collectivite: { nom: 'Ville' } }));
    const getIndicateursValeurs = vi
      .fn()
      .mockResolvedValue(failure('DATABASE_ERROR', cause));

    const result = await exportSelection(
      toService({
        canReadConfidentiel: true,
        listIndicateurs,
        getCollectivite,
        getIndicateursValeurs,
      })
    );

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('convertit une exception imprévue en DATABASE_ERROR', async () => {
    const cause = new Error('connexion perdue');
    const listIndicateurs = vi.fn().mockRejectedValue(cause);

    const result = await exportSelection(
      toService({ canReadConfidentiel: true, listIndicateurs })
    );

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
});
