import type { AuthUser } from '@tet/backend/users/models/auth.models';
import type { IndicateurValeurAvecMetadonnesDefinition } from '@tet/domain/indicateurs';
import { ListIndicateurValeursService } from './list-indicateur-valeurs.service';
import { indicateur1 } from './tests/fixture';

const user = { id: 'reader', role: 'authenticated' } as AuthUser;
const createService = ({ isPrivate = false } = {}) => {
  const repository = {
    listIndicateurValeurs: vi.fn().mockResolvedValue(
      [2024, 2025].map((year) => ({
        indicateurValeur: {
          id: year,
          indicateurId: indicateur1.id,
          collectiviteId: 42,
          dateValeur: `${year}-01-01`,
          resultat: year,
          objectif: 100,
          metadonneeId: null,
        },
        indicateurDefinition: indicateur1,
        indicateurSourceMetadonnee: null,
        confidentiel: true,
      })) as IndicateurValeurAvecMetadonnesDefinition[]
    ),
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
  const service = new ListIndicateurValeursService(
    repository as never,
    permissions as never,
    { isPrivate: vi.fn().mockResolvedValue(isPrivate) } as never,
    definitions as never
  );
  return { service, repository, definitions };
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
      expect.objectContaining({ collectiviteId: 42 })
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
