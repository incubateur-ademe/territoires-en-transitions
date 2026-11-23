import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import ExportIndicateursService from './export-indicateurs.service';

const EMPTY_LIST = { count: 0, data: [] };

const toService = ({
  canReadConfidentiel,
  listIndicateurs,
}: {
  canReadConfidentiel: boolean;
  listIndicateurs: ReturnType<typeof vi.fn>;
}) =>
  new ExportIndicateursService(
    {
      isAllowed: vi
        .fn()
        .mockResolvedValue(
          canReadConfidentiel ? success(undefined) : failure('UNAUTHORIZED')
        ),
    } as never,
    {} as never,
    {} as never,
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
      .mockResolvedValueOnce({
        count: 1,
        data: [{ id: 1, enfants: [{ id: 2 }] }],
      })
      .mockResolvedValueOnce(EMPTY_LIST);
    const service = toService({ canReadConfidentiel: false, listIndicateurs });

    await exportSelection(service).catch(() => undefined);

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
