import { success } from '@tet/backend/utils/result.type';
import { UpdateDiagnosticIndicateursValeursService } from './update-diagnostic-indicateurs-valeurs.service';

const setup = (periodicite: 'annuelle' | 'mensuelle') => {
  const metadata = { getOrCreateMetadonneeId: vi.fn().mockResolvedValue(17) };
  const writer = { upsertIndicateurValeurs: vi.fn().mockResolvedValue([]) };
  const payload = { indicateurValeurs: [] };
  const diagnostic = { loadPayload: vi.fn().mockResolvedValue(payload) };
  const definitions = {
    listPlatformDefinitions: vi
      .fn()
      .mockResolvedValue(success([{ id: 7, periodicite }])),
  };
  const select = vi.fn(() => ({
    from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
  }));
  const tx = { select } as never;
  const service = new UpdateDiagnosticIndicateursValeursService(
    { isAllowed: vi.fn().mockResolvedValue(success(undefined)) } as never,
    { db: { select: vi.fn() } } as never,
    {
      findRef: vi.fn().mockResolvedValue({ status: 'en_elaboration' }),
    } as never,
    metadata as never,
    diagnostic as never,
    writer as never,
    definitions as never
  );
  return {
    service,
    metadata,
    writer,
    diagnostic,
    definitions,
    payload,
    tx,
    select,
  };
};

describe('UpdateDiagnosticIndicateursValeursService annual boundary', () => {
  const user = { id: 'user-id', role: 'authenticated' } as never;
  const input = {
    collectiviteId: 42,
    demarcheId: 3,
    valeurs: [
      { indicateurId: 7, year: 2025, field: 'resultat' as const, value: 12 },
    ],
  };

  it('rejects monthly definitions before creating metadata or values', async () => {
    const { service, tx, metadata, writer } = setup('mensuelle');
    expect(await service.updateValeurs(input, { user, tx })).toMatchObject({
      success: false,
      error: 'INDICATEUR_NON_ANNUEL',
    });
    expect(metadata.getOrCreateMetadonneeId).not.toHaveBeenCalled();
    expect(writer.upsertIndicateurValeurs).not.toHaveBeenCalled();
  });

  it('keeps metadata, existing values, writes and payload reads in the supplied transaction', async () => {
    const { service, tx, metadata, writer, diagnostic, payload, select } =
      setup('annuelle');
    expect(await service.updateValeurs(input, { user, tx })).toEqual(
      success(payload)
    );
    expect(metadata.getOrCreateMetadonneeId).toHaveBeenCalledWith(
      { demarcheId: 3, collectiviteId: 42 },
      tx
    );
    expect(select).toHaveBeenCalledOnce();
    expect(writer.upsertIndicateurValeurs).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          collectiviteId: 42,
          indicateurId: 7,
          metadonneeId: 17,
          dateValeur: '2025-01-01',
          resultat: 12,
        }),
      ],
      { user, tx }
    );
    expect(diagnostic.loadPayload).toHaveBeenCalledWith(
      { demarcheId: 3, collectiviteId: 42 },
      tx
    );
  });
});
