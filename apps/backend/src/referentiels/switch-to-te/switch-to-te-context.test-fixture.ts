import { type AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { type Result } from '@tet/backend/utils/result.type';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { type ScoreSnapshot } from '@tet/domain/referentiels';
import { BuildSwitchToTeContextService } from './build-switch-to-te-context.service';
import { CreatePreSwitchSnapshotsService } from './create-pre-switch-snapshots.service';
import { type SwitchToTeContext } from './shared/switch-to-te-context';
import { type SwitchToTeError } from './switch-to-te.errors';

export async function buildSwitchToTeContextForTest(
  collectiviteId: number,
  prefs: CollectiviteReferentielPreferences,
  services: {
    createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService;
    buildSwitchToTeContextService: BuildSwitchToTeContextService;
  },
  {
    user,
    preSwitchSnapshots,
  }: {
    user: AuthenticatedUser;
    preSwitchSnapshots?: ScoreSnapshot[];
  }
): Promise<Result<SwitchToTeContext, SwitchToTeError>> {
  let snapshots = preSwitchSnapshots;

  if (!snapshots) {
    const snapshotsResult =
      await services.createPreSwitchSnapshotsService.createPreSwitchSnapshots(
        collectiviteId,
        prefs,
        { user }
      );

    if (!snapshotsResult.success) {
      return snapshotsResult;
    }

    snapshots = snapshotsResult.data;
  }

  return services.buildSwitchToTeContextService.build(
    collectiviteId,
    prefs,
    snapshots,
    { user }
  );
}
