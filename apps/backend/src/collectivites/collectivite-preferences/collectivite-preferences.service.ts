import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import type { Result } from '@tet/backend/utils/result.type';
import type { CollectivitePreferences } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import type { UpdateCollectivitePreferencesInput } from './collectivite-preferences.repository';
import { CollectivitePreferencesRepository } from './collectivite-preferences.repository';
import type { CollectivitePreferencesError } from './collectivite-preferences.errors';

@Injectable()
export class CollectivitePreferencesService {
  constructor(
    private readonly repository: CollectivitePreferencesRepository,
    private readonly permission: PermissionService
  ) {}

  async updatePreferences(
    collectiviteId: number,
    preferences: UpdateCollectivitePreferencesInput,
    user: AuthenticatedUser
  ): Promise<Result<CollectivitePreferences, CollectivitePreferencesError>> {
    await this.permission.isAllowed(
      user,
      'collectivites.mutate',
      ResourceType.PLATEFORME,
      null
    );
    return this.repository.updatePreferences(collectiviteId, preferences);
  }
}
