import type { AuthUser } from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { IndicateurValeurAvecMetadonnesDefinition } from '@tet/domain/indicateurs';
import { ListIndicateurValeursService } from './list-indicateur-valeurs.service';
import { indicateur1 } from './tests/fixture';

const user = { id: 'reader', role: 'authenticated' } as AuthUser;
const createService = ({ isPrivate = false } = {}) => {
  const valeurs = [2024, 2025].map((year) => ({
    indicateurValeur: {
      id: year,
      indicateurId: indicateur1.id,
      collectiviteId: 42,
      dateValeur: `${year}-01-01`,
      periodicite: indicateur1.periodicite,
      resultat: year,
      objectif: 100,
      metadonneeId: null,
    },
    indicateurDefinition: indicateur1,
    indicateurSourceMetadonnee: null,
    confidentiel: true,
  })) as IndicateurValeurAvecMetadonnesDefinition[];
  const repository = {
    listIndicateurValeurs: vi.fn().mockResolvedValue(valeurs),
    listSources: vi.fn().mockResolvedValue([]),
  };
  const definitions = {
    listCollectiviteDefinitions: vi.fn().mockResolvedValue([indicateur1]),
  };
  const permissions = {
    isAllowed: vi.fn(async (_user, operation) => ({
      success: operation === 'indicateurs.valeurs.read',
    })),
  };
  const collectivites = { isPrivate: vi.fn().mockResolvedValue(isPrivate) };
  const service = new ListIndicateurValeursService(
    repository as never,
    permissions as never,
    collectivites as never,
    definitions as never
  );
  return {
    service,
    repository,
    definitions,
    permissions,
    collectivites,
    valeurs,
  };
};

describe('ListIndicateurValeursService confidentiality', () => {
  it('masks only the latest result from a confidential indicator for a public visitor', async () => {
    const { service, definitions } = createService();
    const result = await service.list(
      { collectiviteId: 42, indicateurIds: [indicateur1.id] },
      { user }
    );
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data.indicateurs[0].sources.collectivite.valeurs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 2024, resultat: 2024, objectif: 100 }),
        expect.objectContaining({ id: 2025, resultat: null, objectif: 100 }),
      ])
    );
    expect(definitions.listCollectiviteDefinitions).toHaveBeenCalledWith(
      expect.objectContaining({ collectiviteId: 42 }),
      undefined
    );
  });

  it('rejects private collectivité access before reading its values', async () => {
    const { service, repository } = createService({ isPrivate: true });
    const result = await service.list(
      { collectiviteId: 42, indicateurIds: [indicateur1.id] },
      { user }
    );
    expect(result).toEqual(
      expect.objectContaining({ success: false, error: 'UNAUTHORIZED' })
    );
    expect(repository.listIndicateurValeurs).not.toHaveBeenCalled();
  });
});

describe('ListIndicateurValeursService transactions', () => {
  it('includes definitions and source labels only visible inside the caller transaction', async () => {
    const tx = {} as Transaction;
    const { service, repository, definitions, valeurs } = createService();
    const source = {
      id: 'new-source',
      libelle: 'Nouvelle source',
      ordreAffichage: 1,
    };
    const metadonnee = {
      id: 7,
      sourceId: source.id,
      dateVersion: '2025-01-01',
      nomDonnees: null,
      diffuseur: null,
      producteur: null,
      methodologie: null,
      limites: null,
    };
    repository.listIndicateurValeurs.mockImplementation(
      async (_input, readTx) =>
        readTx === tx
          ? [
              {
                ...valeurs[0],
                indicateurValeur: {
                  ...valeurs[0].indicateurValeur,
                  metadonneeId: metadonnee.id,
                },
                indicateurSourceMetadonnee: metadonnee,
              },
            ]
          : []
    );
    definitions.listCollectiviteDefinitions.mockImplementation(
      async (_input, readTx) => (readTx === tx ? [indicateur1] : [])
    );
    repository.listSources.mockImplementation(async (_sourceIds, readTx) =>
      readTx === tx ? [source] : []
    );

    const result = await service.list(
      { collectiviteId: 42, indicateurIds: [indicateur1.id] },
      { isUserTrusted: true, tx }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        count: 1,
        indicateurs: [
          {
            definition: { id: indicateur1.id },
            sources: {
              [source.id]: {
                libelle: source.libelle,
                metadonnees: [metadonnee],
                valeurs: [{ resultat: 2024 }],
              },
            },
          },
        ],
      },
    });
  });

  it('uses the transaction for privacy and permission checks', async () => {
    const tx = {} as Transaction;
    const { service, permissions, collectivites } = createService();

    await service.list(
      { collectiviteId: 42, indicateurIds: [indicateur1.id] },
      { user, tx }
    );

    expect(collectivites.isPrivate).toHaveBeenCalledWith(42, tx);
    expect(permissions.isAllowed).toHaveBeenCalledTimes(2);
    for (const call of permissions.isAllowed.mock.calls) {
      expect(call).toEqual([
        user,
        expect.any(String),
        expect.any(String),
        { collectiviteId: 42 },
        tx,
      ]);
    }
  });
});
