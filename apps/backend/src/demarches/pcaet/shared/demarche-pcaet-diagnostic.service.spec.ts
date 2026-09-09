import { DemarchePcaetDiagnosticService } from './demarche-pcaet-diagnostic.service';

describe('DemarchePcaetDiagnosticService', () => {
  const setup = (
    periodicite: 'annuelle' | 'mensuelle',
    metadonneeId: number | null = 15
  ) => {
    const valeurs = { getIndicateursValeurs: vi.fn().mockResolvedValue([]) };
    const definitions = {
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValue({
          success: true,
          data: [{ id: 7, identifiantReferentiel: 'cae_1.c', periodicite }],
        }),
    };
    const metadata = {
      findMetadonneeId: vi.fn().mockResolvedValue(metadonneeId),
    };
    const service = new DemarchePcaetDiagnosticService(
      {
        loadVulnerabilite: vi
          .fn()
          .mockResolvedValue({ thematiques: [], lignes: [] }),
      } as never,
      valeurs as never,
      definitions as never,
      metadata as never
    );
    return { service, valeurs, metadata };
  };

  it('refuse un indicateur mensuel dans le diagnostic annuel', async () => {
    const { service } = setup('mensuelle');
    await expect(
      service.loadPayload({ demarcheId: 3, collectiviteId: 42 })
    ).rejects.toThrow(
      'Le diagnostic PCAET (cae_1.c) exige une périodicité annuelle, reçu : mensuelle'
    );
  });

  it('limite la lecture à la métadonnée de la démarche dans la même transaction', async () => {
    const { service, valeurs, metadata } = setup('annuelle');
    const tx = {} as never;
    await service.loadPayload({ demarcheId: 3, collectiviteId: 42 }, tx);
    expect(metadata.findMetadonneeId).toHaveBeenCalledWith(
      { demarcheId: 3, collectiviteId: 42 },
      tx
    );
    expect(valeurs.getIndicateursValeurs).toHaveBeenCalledWith(
      expect.objectContaining({
        metadonneeId: 15,
        sources: ['pcaet-collectivite'],
      }),
      undefined,
      tx
    );
  });

  it('ne retombe pas sur les autres dépôts sans métadonnée', async () => {
    const { service, valeurs } = setup('annuelle', null);
    await service.loadPayload({ demarcheId: 3, collectiviteId: 42 });
    expect(valeurs.getIndicateursValeurs).not.toHaveBeenCalled();
  });
});
