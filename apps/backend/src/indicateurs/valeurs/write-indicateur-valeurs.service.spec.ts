import {
  IndicateurDefinition,
  IndicateurPeriodiciteEnum,
} from '@tet/domain/indicateurs';
import { success } from '../../utils/result.type';
import { upsertIndicateursValeursRequestSchema } from './upsert-indicateurs-valeurs.request';
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

  it('accepte une ancienne saisie annuelle datée au 31 décembre', async () => {
    const repository = { upsertUserValeur: vi.fn(async (value) => value) };
    const service = new WriteIndicateurValeursService(
      repository as never,
      {} as never,
      { lockDefinitions: vi.fn().mockResolvedValue([definition]) } as never,
      { lock: vi.fn() } as never
    );
    const tx = {} as never;
    const result = await service.saveSingle(
      { data: { ...valeur, dateValeur: '2026-12-31' }, definition },
      { tx, user: { id: 'user' } as never }
    );
    expect(result.success).toBe(true);
    expect(repository.upsertUserValeur).toHaveBeenCalledWith(
      expect.objectContaining({
        periodicite: 'annuelle',
        dateValeur: '2026-01-01',
        resultat: 42,
      }),
      tx
    );
  });

  it('accepte les dates annuelles historiques dans les imports par lot', async () => {
    const repository = {
      upsertValeursWithoutMetadata: vi.fn(async (values) => values),
    };
    const service = new WriteIndicateurValeursService(
      repository as never,
      {
        validate: vi.fn().mockResolvedValue(success({ 10: definition })),
      } as never,
      {} as never,
      { lock: vi.fn() } as never
    );
    const tx = {} as never;
    const result = await service.saveBatch(
      {
        valeurs: [{ ...valeur, dateValeur: '2026-06-15' }],
        definitions: { 10: definition },
      },
      { isUserTrusted: true, tx }
    );
    expect(result.success).toBe(true);
    expect(repository.upsertValeursWithoutMetadata).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          periodicite: 'annuelle',
          dateValeur: '2026-01-01',
          resultat: 42,
        }),
      ],
      tx
    );
  });

  it('preserves separate monthly values alongside a legacy annual value in a bulk request', async () => {
    const repository = {
      upsertValeursWithoutMetadata: vi.fn(async (values) => values),
    };
    const service = new WriteIndicateurValeursService(
      repository as never,
      {
        validate: vi.fn().mockResolvedValue(success({ 10: definition })),
      } as never,
      {} as never,
      { lock: vi.fn() } as never
    );
    const { valeurs } = upsertIndicateursValeursRequestSchema.parse({
      valeurs: [
        { ...valeur, dateValeur: '2026-12-31' },
        {
          ...valeur,
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
          dateValeur: '2026-06-01',
          resultat: 0,
        },
        {
          ...valeur,
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
          dateValeur: '2026-07-01',
          resultat: 12,
        },
      ],
    });

    const result = await service.saveBatch(
      { valeurs, definitions: { 10: definition } },
      { isUserTrusted: true, tx: {} as never }
    );

    expect(result).toMatchObject({
      success: true,
      data: [
        {
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          dateValeur: '2026-01-01',
          resultat: 42,
        },
        {
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
          dateValeur: '2026-06-01',
          resultat: 0,
        },
        {
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
          dateValeur: '2026-07-01',
          resultat: 12,
        },
      ],
    });
  });

  it('rejects a noncanonical monthly date before persisting any value in the batch', async () => {
    const repository = {
      upsertValeursWithMetadata: vi.fn(),
      upsertValeursWithoutMetadata: vi.fn(),
    };
    const service = new WriteIndicateurValeursService(
      repository as never,
      {
        validate: vi.fn().mockResolvedValue(success({ 10: definition })),
      } as never,
      {} as never,
      { lock: vi.fn() } as never
    );
    const { valeurs } = upsertIndicateursValeursRequestSchema.parse({
      valeurs: [
        valeur,
        {
          ...valeur,
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
          dateValeur: '2026-06-15',
          metadonneeId: 7,
        },
      ],
    });

    const result = await service.saveBatch(
      { valeurs, definitions: { 10: definition } },
      { isUserTrusted: true, tx: {} as never }
    );

    expect(result).toMatchObject({ success: false, error: 'INVALID_VALUE' });
    expect(repository.upsertValeursWithMetadata).not.toHaveBeenCalled();
    expect(repository.upsertValeursWithoutMetadata).not.toHaveBeenCalled();
  });
});
