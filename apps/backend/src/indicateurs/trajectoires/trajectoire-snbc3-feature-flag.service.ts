import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  isAuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';

/**
 * Ouverture progressive de la trajectoire SNBC 3 (ADR 0023, §4) : les valeurs
 * `snbc3` ne sont servies qu'aux utilisateurs qui ont le flag
 * `is-trajectoire-snbc3-enabled`. Sans utilisateur authentifié (anonyme, clé
 * d'API de service, service role, appel interne), le flag vaut `false`.
 *
 * Le flag est évalué avec le groupe `collectivite` : on peut l'ouvrir à des
 * utilisateurs, puis à des collectivités.
 */
@Injectable()
export class TrajectoireSnbc3FeatureFlagService {
  constructor(private readonly trackingService: TrackingService) {}

  isTrajectoireSnbc3Enabled(
    user: AuthUser | null | undefined,
    collectiviteId: number
  ): Promise<boolean> {
    return this.isTrajectoireSnbc3EnabledForUserId(
      user && isAuthenticatedUser(user) ? user.id : undefined,
      collectiviteId
    );
  }

  /** Pour les traitements en arrière-plan, qui n'ont que l'id de l'utilisateur (rapport PPT). */
  isTrajectoireSnbc3EnabledForUserId(
    userId: string | undefined,
    collectiviteId: number
  ): Promise<boolean> {
    return this.trackingService.isFeatureEnabled(
      'is-trajectoire-snbc3-enabled',
      userId,
      collectiviteId
    );
  }

  /**
   * Retire la source `snbc3` d'une liste quand le flag est inactif.
   * `isEnabled` remplace l'évaluation du flag quand l'appelant l'a déjà faite
   * (traitement en arrière-plan sans utilisateur).
   */
  async filterSourcesSnbc3<T>(
    elements: T[],
    getSourceId: (element: T) => string | null | undefined,
    user: AuthUser | null | undefined,
    collectiviteId: number,
    isEnabled?: boolean
  ): Promise<T[]> {
    if (!elements.some((e) => getSourceId(e) === IndicateurSourceEnum.SNBC3)) {
      return elements;
    }
    if (
      isEnabled ??
      (await this.isTrajectoireSnbc3Enabled(user, collectiviteId))
    ) {
      return elements;
    }
    return elements.filter(
      (e) => getSourceId(e) !== IndicateurSourceEnum.SNBC3
    );
  }
}
