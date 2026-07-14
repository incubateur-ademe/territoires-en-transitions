import { type AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { type Result } from '@tet/backend/utils/result.type';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { type ScoreSnapshot } from '@tet/domain/referentiels';
import { type BuildSwitchToTeContextService } from './build-switch-to-te-context.service';
import { type CreatePreSwitchSnapshotsService } from './create-pre-switch-snapshots.service';
import { type SwitchToTeContext } from './shared/switch-to-te-context';
import { type SwitchToTeError } from './switch-to-te.errors';

export async function buildSwitchToTeContextForTest(
  collectiviteId: number,
  prefs: CollectiviteReferentielPreferences,
  services: {
    createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService;
    buildSwitchToTeContextService: BuildSwitchToTeContextService;
  },
  options: {
    user: AuthenticatedUser;
    preSwitchSnapshots?: ScoreSnapshot[];
  }
): Promise<Result<SwitchToTeContext, SwitchToTeError>> {
  let preSwitchSnapshots = options.preSwitchSnapshots;

  if (preSwitchSnapshots === undefined) {
    const createResult =
      await services.createPreSwitchSnapshotsService.createPreSwitchSnapshots(
        collectiviteId,
        prefs,
        { user: options.user }
      );

    if (!createResult.success) {
      return createResult;
    }

    preSwitchSnapshots = createResult.data;
  }

  return services.buildSwitchToTeContextService.build(
    collectiviteId,
    prefs,
    preSwitchSnapshots,
    { user: options.user }
  );
}
