import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import { type LevierGrid } from '../grid.repository';
import { VoletErrorEnum, type VoletError } from '../volet.errors';
import { GetMobilisationService } from './get-mobilisation.service';

const collectiviteId = 7;

const user: AuthenticatedUser = {
  id: 'a-user',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
} as AuthenticatedUser;

const grid = [
  {
    levierId: 'covoiturage' as const,
    volets: [{ categorie: 'amenagement' as const, note: 2, ficheIds: [42] }],
  },
];

const toService = ({
  gridOutcome = success(grid) as Result<LevierGrid[], VoletError>,
  isAllowed = true,
} = {}) => {
  const permissions = {
    isAllowed: vi
      .fn()
      .mockResolvedValue(
        isAllowed ? success(undefined) : failure('UNAUTHORIZED')
      ),
  };
  const gridRepository = {
    getGrid: vi.fn().mockResolvedValue(gridOutcome),
  };

  return new GetMobilisationService(
    permissions as never,
    gridRepository as never
  );
};

describe('GetMobilisationService.getMobilisation', () => {
  it('rend la grille de la collectivite a un de ses membres', async () => {
    const service = toService();

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: true,
      data: { collectiviteId, leviers: grid },
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
      error: ClassificationVoletsErrorEnum.COLLECTIVITE_NOT_FOUND,
    });
  });

  it('traduit une lecture de grille impossible en erreur de mobilisation', async () => {
    const service = toService({
      gridOutcome: failure(VoletErrorEnum.GET_VOLETS_ERROR),
    });

    const result = await service.getMobilisation(
      { collectiviteId, enjeu: 'ges' },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: ClassificationVoletsErrorEnum.GET_MOBILISATION_ERROR,
    });
  });
});
