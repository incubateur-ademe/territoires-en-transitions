import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
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

const leviers = [
  {
    levierId: 'covoiturage' as const,
    volets: [{ categorie: 'amenagement' as const, note: 2, ficheIds: [42] }],
  },
];

const toService = ({
  mobilisationOutcome = success(leviers) as Result<
    LevierMobilisation[],
    VoletError
  >,
  isAllowed = true,
} = {}) => {
  const permissions = {
    isAllowed: vi
      .fn()
      .mockResolvedValue(
        isAllowed ? success(undefined) : failure('UNAUTHORIZED')
      ),
  };
  const mobilisationRepository = {
    getMobilisation: vi.fn().mockResolvedValue(mobilisationOutcome),
  };

  return new GetMobilisationService(
    permissions as never,
    mobilisationRepository as never
  );
};

describe('GetMobilisationService.getMobilisation', () => {
  it('rend la mobilisation de la collectivite a un de ses membres', async () => {
    const service = toService();

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { collectiviteId, leviers },
    });
  });

  it("presente la collectivite comme introuvable a qui n'en est pas membre", async () => {
    const service = toService({ isAllowed: false });

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
    const service = toService({
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
