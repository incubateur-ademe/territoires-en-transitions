import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import type { Result } from '@tet/backend/utils/result.type';
import type {
  CollectivitePreferences,
  ReferentielDisplayMap,
} from '@tet/domain/collectivites';
import {
  getEnabledReferentielIdsFromDisplayMap,
  REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import type { CollectivitePreferencesError } from './collectivite-preferences.errors';
import type { UpdateCollectivitePreferencesInput } from './collectivite-preferences.repository';
import { CollectivitePreferencesRepository } from './collectivite-preferences.repository';

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

  async getPreferences(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<
    Result<CollectivitePreferences | null, CollectivitePreferencesError>
  > {
    await this.permission.isAllowed(
      user,
      'collectivites.read',
      ResourceType.PLATEFORME,
      null
    );
    return this.repository.getPreferencesByCollectiviteId(collectiviteId);
  }

  /**
   * Fourni la liste des référentiels activés en fonction du feature flag
   * `is-referentiel-te-enabled` et des préférences
   */
  async getEnabledReferentiels(
    isReferentielTEEnabled: boolean,
    collectiviteId: number | undefined,
    user: AuthenticatedUser
  ): Promise<ReferentielId[]> {
    let referentielsDisplayMap: ReferentielDisplayMap =
      REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY;
    if (isReferentielTEEnabled && collectiviteId) {
      const result = await this.getPreferences(collectiviteId, user);
      if (result.success && result.data) {
        referentielsDisplayMap = result.data.referentiels.display;
      }
    }
    return getEnabledReferentielIdsFromDisplayMap(referentielsDisplayMap);
  }
}
