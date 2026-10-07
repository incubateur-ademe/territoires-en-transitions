import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
import { EnjeuRepositories } from '../enjeu.repositories';
import { type LevierMobilisation } from '../mobilisation.repository';
import { VoletErrorEnum, type VoletError } from '../volet.errors';
import { GetMobilisationService } from './get-mobilisation.service';

const collectiviteId = 7;

const user: AuthenticatedUser = {
  id: 'a-user',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
} as AuthenticatedUser;

const leviers: LevierMobilisation[] = [
  {
    levierId: 'covoiturage',
    volets: [{ categorie: 'amenagement', note: 2, ficheIds: [42] }],
  },
];

const toService = ({
  mobilisationOutcome = success(leviers) as Result<
    LevierMobilisation[],
    VoletError
  >,
  isAllowed = true,
  isCollectivitePrivate = false,
} = {}): {
  service: GetMobilisationService;
  isAllowedSpy: Mock;
} => {
  const isAllowedSpy = vi
    .fn()
    .mockResolvedValue(
      isAllowed ? success(undefined) : failure('UNAUTHORIZED')
    );
  const permissionService = {
    isAllowed: isAllowedSpy,
  } as unknown as PermissionService;
  const collectivitesService = {
    isPrivate: vi.fn().mockResolvedValue(isCollectivitePrivate),
  } as unknown as CollectivitesService;
  const mobilisationRepository = {
    getMobilisation: vi.fn().mockResolvedValue(mobilisationOutcome),
  };
  const enjeuRepositories = {
    mobilisationOf: () => mobilisationRepository,
  } as unknown as EnjeuRepositories;

  return {
    service: new GetMobilisationService(
      permissionService,
      collectivitesService,
      enjeuRepositories
    ),
    isAllowedSpy,
  };
};

describe('GetMobilisationService.getMobilisation', () => {
  it('rend, par levier et par catégorie, le nombre de fiches mobilisées', async () => {
    const { service } = toService();

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: {
        collectiviteId,
        leviers: [
          {
            levierId: 'covoiturage',
            ficheCount: 1,
            volets: [{ categorie: 'amenagement', note: 2, ficheCount: 1 }],
          },
        ],
      },
    });
  });

  it("compte au levier l'union des fiches de ses catégories, une fiche partagée comptant une fois", async () => {
    const { service } = toService({
      mobilisationOutcome: success([
        {
          levierId: 'covoiturage',
          volets: [
            { categorie: 'amenagement', note: 2, ficheIds: [42, 43] },
            { categorie: 'planification', note: 1, ficheIds: [42, 44] },
          ],
        },
      ]),
    });

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: {
        collectiviteId,
        leviers: [
          {
            levierId: 'covoiturage',
            ficheCount: 3,
            volets: [
              { categorie: 'amenagement', note: 2, ficheCount: 2 },
              { categorie: 'planification', note: 1, ficheCount: 2 },
            ],
          },
        ],
      },
    });
  });

  it('compte une seule fois une fiche répétée dans une même catégorie', async () => {
    const { service } = toService({
      mobilisationOutcome: success([
        {
          levierId: 'covoiturage',
          volets: [{ categorie: 'amenagement', note: 2, ficheIds: [42, 42] }],
        },
      ]),
    });

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: {
        collectiviteId,
        leviers: [
          {
            levierId: 'covoiturage',
            ficheCount: 1,
            volets: [{ categorie: 'amenagement', note: 2, ficheCount: 1 }],
          },
        ],
      },
    });
  });

  it('compte zéro fiche à un levier dont aucune catégorie ne rattache de fiche', async () => {
    const { service } = toService({
      mobilisationOutcome: success([
        {
          levierId: 'covoiturage',
          volets: [{ categorie: 'amenagement', note: 0, ficheIds: [] }],
        },
      ]),
    });

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: {
        collectiviteId,
        leviers: [
          {
            levierId: 'covoiturage',
            ficheCount: 0,
            volets: [{ categorie: 'amenagement', note: 0, ficheCount: 0 }],
          },
        ],
      },
    });
  });

  it.each([
    {
      isCollectivitePrivate: false,
      operation: PermissionOperationEnum['PLANS.FICHES.READ'],
    },
    {
      isCollectivitePrivate: true,
      operation: PermissionOperationEnum['PLANS.FICHES.READ_CONFIDENTIEL'],
    },
  ])(
    'exige $operation quand la collectivite est privee : $isCollectivitePrivate',
    async ({ isCollectivitePrivate, operation }) => {
      const { service, isAllowedSpy } = toService({ isCollectivitePrivate });

      await service.getMobilisation({ collectiviteId, enjeu: 'ges' }, { user });

      expect(isAllowedSpy).toHaveBeenCalledWith(
        user,
        operation,
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
    }
  );

  it('presente la collectivite comme introuvable a qui ne peut pas en lire les fiches', async () => {
    const { service } = toService({ isAllowed: false });

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: AnalysisJobErrorEnum.COLLECTIVITE_NOT_FOUND,
    });
  });

  it('traduit une lecture de mobilisation impossible en erreur de mobilisation', async () => {
    const { service } = toService({
      mobilisationOutcome: failure(VoletErrorEnum.GET_VOLETS_ERROR),
    });

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: AnalysisJobErrorEnum.GET_MOBILISATION_ERROR,
    });
  });
});
