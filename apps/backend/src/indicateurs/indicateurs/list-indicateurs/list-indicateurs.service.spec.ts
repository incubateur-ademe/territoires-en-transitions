import { AuthUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ListIndicateursRepository } from './list-indicateurs.repository';
import { ListIndicateursService } from './list-indicateurs.service';

const input = {
  collectiviteId: 1,
  filters: {},
  queryOptions: { page: 1, limit: 10 },
} as never;
const user = { id: 'user-1' } as AuthUser;

const makeService = ({
  listIndicateurs = vi.fn(),
  getFavorisCount = vi.fn(),
  isAllowed = vi.fn().mockResolvedValue(success(undefined)),
  isApiKeyAllowed = vi.fn(() => success(undefined)),
}: {
  listIndicateurs?: ReturnType<typeof vi.fn>;
  getFavorisCount?: ReturnType<typeof vi.fn>;
  isAllowed?: ReturnType<typeof vi.fn>;
  isApiKeyAllowed?: ReturnType<typeof vi.fn>;
}): ListIndicateursService => {
  const repository = {
    listIndicateurs,
    getFavorisCount,
  } as unknown as ListIndicateursRepository;
  const permissionService = {
    isAllowed,
    isApiKeyAllowed,
  } as unknown as PermissionService;
  return new ListIndicateursService(repository, permissionService);
};

describe('ListIndicateursService.listIndicateurs', () => {
  it('retire le compteur de chaque ligne et pagine le résultat', async () => {
    const service = makeService({
      listIndicateurs: vi.fn().mockResolvedValue(
        success([
          { id: 1, count: 25 },
          { id: 2, count: 25 },
        ])
      ),
    });

    await expect(service.listIndicateurs(input)).resolves.toEqual(
      success({
        data: [{ id: 1 }, { id: 2 }],
        count: 25,
        page: 1,
        pageSize: 10,
        pageCount: 3,
      })
    );
  });

  it('retourne DATABASE_ERROR portant la cause quand la nature est incohérente', async () => {
    const cause = new Error(
      'Indicateur 7 : nature incohérente (PERSO_WITH_GROUPEMENT)'
    );
    const service = makeService({
      listIndicateurs: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause)),
    });

    await expect(service.listIndicateurs(input)).resolves.toEqual(
      failure('DATABASE_ERROR', cause)
    );
  });

  it('retourne DATABASE_ERROR avec sa cause quand la lecture rejette', async () => {
    const cause = new Error('connexion perdue');
    const service = makeService({
      listIndicateurs: vi.fn().mockRejectedValue(cause),
    });

    await expect(service.listIndicateurs(input)).resolves.toEqual(
      failure('DATABASE_ERROR', cause)
    );
  });

  it('retourne UNAUTHORIZED avec le message de refus sans lire quand le droit de lecture manque', async () => {
    const listIndicateurs = vi.fn();
    const service = makeService({
      listIndicateurs,
      isAllowed: vi.fn().mockResolvedValue(failure('UNAUTHORIZED')),
    });

    await expect(service.listIndicateurs(input, user)).resolves.toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          "Droits insuffisants, l'utilisateur user-1 n'a pas l'autorisation indicateurs.indicateurs.read sur la ressource Collectivité 1"
        )
      )
    );
    expect(listIndicateurs).not.toHaveBeenCalled();
  });

  it("nomme la clé d'api dans le refus quand sa permission manque", async () => {
    const service = makeService({
      isAllowed: vi.fn().mockResolvedValue(failure('UNAUTHORIZED')),
      isApiKeyAllowed: vi.fn(() => failure('UNAUTHORIZED')),
    });

    await expect(service.listIndicateurs(input, user)).resolves.toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          "Droits insuffisants, la clé d'api n'a pas l'autorisation indicateurs.indicateurs.read."
        )
      )
    );
  });
});

describe('ListIndicateursService.getIndicateur', () => {
  it('retourne INDICATEUR_NOT_FOUND avec le message d’origine quand aucun indicateur ne correspond', async () => {
    const service = makeService({
      listIndicateurs: vi.fn().mockResolvedValue(success([])),
    });

    await expect(
      service.getIndicateur({ indicateurId: 42, collectiviteId: 1 })
    ).resolves.toEqual(
      failure(
        'INDICATEUR_NOT_FOUND',
        new Error('Indicateur not found for id 42')
      )
    );
  });

  it('retourne l’indicateur trouvé', async () => {
    const service = makeService({
      listIndicateurs: vi
        .fn()
        .mockResolvedValue(success([{ id: 42, count: 1 }])),
    });

    await expect(
      service.getIndicateur({ indicateurId: 42, collectiviteId: 1 })
    ).resolves.toEqual(success({ id: 42 }));
  });
});

describe('ListIndicateursService.getMesIndicateursCount', () => {
  it('retourne UNAUTHORIZED quand l’utilisateur n’a pas d’identifiant', async () => {
    const service = makeService({});

    await expect(
      service.getMesIndicateursCount({ collectiviteId: 1 }, {
        id: null,
      } as AuthUser)
    ).resolves.toEqual(
      failure('UNAUTHORIZED', new Error('Id utilisateur non valide'))
    );
  });
});

describe('ListIndicateursService.getFavorisCount', () => {
  it('retourne DATABASE_ERROR avec sa cause quand le comptage rejette', async () => {
    const cause = new Error('connexion perdue');
    const service = makeService({
      getFavorisCount: vi.fn().mockRejectedValue(cause),
    });

    await expect(
      service.getFavorisCount({ collectiviteId: 1 }, user)
    ).resolves.toEqual(failure('DATABASE_ERROR', cause));
  });
});
