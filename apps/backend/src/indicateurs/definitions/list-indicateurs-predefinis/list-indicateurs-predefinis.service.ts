import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@tet/backend/users/models/auth.models';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { IndicateurPredefini } from '@tet/domain/indicateurs';
import { ListIndicateursPredefinisRepository } from './list-indicateurs-predefinis.repository';

type IndicateurPredefiniReadContext = Omit<ServiceSecondArg, 'user'> & {
  user: AuthUser | null;
};
type ListInput = Parameters<
  ListIndicateursPredefinisRepository['listIndicateursPredefinis']
>[0];
type AggregateInput = Parameters<
  ListIndicateursPredefinisRepository['listIndicateursPredefinisAggregates']
>[0];

/** Public catalog reads; caller identity is carried without restricting access. */
@Injectable()
export class ListIndicateursPredefinisService {
  constructor(
    private readonly repository: ListIndicateursPredefinisRepository
  ) {}

  async listIndicateursPredefinis(
    input: ListInput,
    { tx }: IndicateurPredefiniReadContext
  ): Promise<Result<IndicateurPredefini[], 'DATABASE_ERROR'>> {
    try {
      return await this.repository.listIndicateursPredefinis(input, tx);
    } catch (error) {
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async listIndicateursPredefinisAggregates(
    input: AggregateInput,
    { tx }: IndicateurPredefiniReadContext
  ): Promise<Result<IndicateurPredefini[], 'DATABASE_ERROR'>> {
    try {
      return await this.repository.listIndicateursPredefinisAggregates(
        input,
        tx
      );
    } catch (error) {
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async listIndicateursPredefinisIdsByIdentifiantReferentiels(
    identifiantsReferentiel: string[],
    context: IndicateurPredefiniReadContext
  ): Promise<Result<Record<string, number>, 'DATABASE_ERROR'>> {
    if (!identifiantsReferentiel.length) return success({});
    const result = await this.listIndicateursPredefinis(
      { identifiantsReferentiel },
      context
    );
    if (!result.success) return result;
    return success(
      Object.fromEntries(
        result.data.flatMap(({ id, identifiantReferentiel }) =>
          identifiantReferentiel ? [[identifiantReferentiel, id]] : []
        )
      )
    );
  }
}
