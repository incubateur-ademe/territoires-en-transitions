import { IndicateurDefinition } from '@tet/domain/indicateurs';
import { success } from '../../utils/result.type';
import { WriteIndicateurValeursService } from './write-indicateur-valeurs.service';

describe('WriteIndicateurValeursService', () => {
  const definition = {
    id: 10,
    periodicite: 'annuelle',
    precision: 2,
    identifiantReferentiel: 'cae_1.a',
  } as IndicateurDefinition;
  const valeur = {
    collectiviteId: 3,
    indicateurId: definition.id,
    dateValeur: '2026-01-01',
    resultat: 42,
  };

  it('retourne la source de chaque métadonnée sans dépendre du recalcul', async () => {
    const valeurs = [
      { ...valeur, metadonneeId: 2 },
      { ...valeur, metadonneeId: 1 },
      { ...valeur, collectiviteId: 4, metadonneeId: 2 },
      { ...valeur, metadonneeId: null },
    ];
    const repository = {
      upsertValeursWithMetadata: vi.fn().mockResolvedValue(valeurs.slice(0, 3)),
      upsertValeursWithoutMetadata: vi.fn().mockResolvedValue(valeurs.slice(3)),
      listMetadataSources: vi.fn().mockResolvedValue([
        { id: 1, sourceId: 'rare' },
        { id: 2, sourceId: 'insee' },
      ]),
    };
    const tx = { marker: 'transaction' };
    const service = new WriteIndicateurValeursService(
      repository as never,
      {
        validate: vi.fn().mockResolvedValue(success({ 10: definition })),
      } as never,
      {} as never,
      { lock: vi.fn() } as never
    );

    const result = await service.saveBatch(
      { valeurs, definitions: { 10: definition } },
      { isUserTrusted: true, tx: tx as never }
    );

    expect(result).toEqual(
      success([
        { ...valeurs[0], indicateurIdentifiant: 'cae_1.a', sourceId: 'insee' },
        { ...valeurs[1], indicateurIdentifiant: 'cae_1.a', sourceId: 'rare' },
        { ...valeurs[2], indicateurIdentifiant: 'cae_1.a', sourceId: 'insee' },
        { ...valeurs[3], indicateurIdentifiant: 'cae_1.a' },
      ])
    );
    expect(repository.listMetadataSources).toHaveBeenCalledWith([2, 1], tx);
  });

  it('ne charge aucune métadonnée pour les valeurs saisies par la collectivité', async () => {
    const repository = {
      upsertValeursWithoutMetadata: vi.fn().mockResolvedValue([valeur]),
      listMetadataSources: vi.fn(),
    };
    const service = new WriteIndicateurValeursService(
      repository as never,
      {
        validate: vi.fn().mockResolvedValue(success({ 10: definition })),
      } as never,
      {} as never,
      { lock: vi.fn() } as never
    );

    const result = await service.saveBatch(
      { valeurs: [valeur], definitions: { 10: definition } },
      { isUserTrusted: true, tx: {} as never }
    );

    expect(result).toEqual(
      success([{ ...valeur, indicateurIdentifiant: 'cae_1.a' }])
    );
    expect(repository.listMetadataSources).not.toHaveBeenCalled();
  });
});
