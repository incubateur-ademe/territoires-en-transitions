import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@tet/backend/users/models/auth.models';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ListPlatformDefinitionsRepository } from './list-platform-definitions.repository';

type DefinitionReadContext = Omit<ServiceSecondArg, 'user'> & {
  user: AuthUser | null;
};
type ListInput = Parameters<
  ListPlatformDefinitionsRepository['listPlatformDefinitions']
>[0];
type AggregateInput = Parameters<
  ListPlatformDefinitionsRepository['listPlatformDefinitionAggregates']
>[0];
type Definitions = Awaited<
  ReturnType<ListPlatformDefinitionsRepository['listPlatformDefinitions']>
>;
type Aggregates = Awaited<
  ReturnType<
    ListPlatformDefinitionsRepository['listPlatformDefinitionAggregates']
  >
>;

/** Public catalog reads; caller identity is carried without restricting access. */
@Injectable()
export class ListPlatformDefinitionsService {
  constructor(private readonly repository: ListPlatformDefinitionsRepository) {}

  async listPlatformDefinitions(
    input: ListInput,
    { tx }: DefinitionReadContext
  ): Promise<Result<Definitions, 'DATABASE_ERROR'>> {
    try {
      return success(await this.repository.listPlatformDefinitions(input, tx));
    } catch (error) {
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async listPlatformDefinitionAggregates(
    input: AggregateInput,
    { tx }: DefinitionReadContext
  ): Promise<Result<Aggregates, 'DATABASE_ERROR'>> {
    try {
      return success(
        await this.repository.listPlatformDefinitionAggregates(input, tx)
      );
    } catch (error) {
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async listPlatformDefinitionIdsByIdentifiantReferentiels(
    identifiantsReferentiel: string[],
    context: DefinitionReadContext
  ): Promise<Result<Record<string, number>, 'DATABASE_ERROR'>> {
    if (!identifiantsReferentiel.length) return success({});
    const result = await this.listPlatformDefinitions(
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
