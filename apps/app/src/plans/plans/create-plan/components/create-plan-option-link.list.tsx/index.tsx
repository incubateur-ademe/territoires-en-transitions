'use client';
import { appLabels } from '@/app/labels/catalog';
import {
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
  makeCollectivitePlansActionsImporterIaUrl,
} from '@/app/app/paths';
import { Event, Icon, useEventTracker } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { BetaLabel } from '@/app/ui/beta.label';
import { useAvailableAiImportProfiles } from '@/app/plans/plans/import-plan/data/use-available-ai-import-profiles';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import CreatePlanPicto from './create.svg';
import ImportPlanPicto from './import.svg';
import { Link } from './link';

export const CreatePlanOptionLinksList = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const tracker = useEventTracker();
  const { profiles } = useAvailableAiImportProfiles();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
  const showAiImport = isSuperAdminRoleEnabled && profiles.length > 0;
  return (
    <div
      data-test="choix-creation-plan"
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', {
        'sm:grid-cols-3': showAiImport,
      })}
    >
      <Link
        variant="primary"
        title={appLabels.creerPlan}
        subTitle={appLabels.creerPlanSousTitre}
        icon={<CreatePlanPicto />}
        url={makeCollectivitePlansActionsCreerUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.createPlan);
        }}
      />
      {showAiImport ? (
        <Link
          dataTest="choix-creation-plan.importer-ia"
          title={<BetaLabel>{appLabels.importPlanIaChoixTitre}</BetaLabel>}
          subTitle={appLabels.importPlanIaTypesCompatiblesSousTitre(profiles)}
          icon={<ImportPlanPicto />}
          url={makeCollectivitePlansActionsImporterIaUrl({
            collectiviteId,
          })}
          onClickCallback={() => {
            tracker(Event.plans.importPlan);
          }}
        />
      ) : null}
      <Link
        dataTest="choix-creation-plan.demander-import"
        title={appLabels.importPlanSupportTitre}
        subTitle={appLabels.importPlanSupportSousTitre}
        icon={<Icon icon="mail-send-line" className="w-16 h-16 my-3" />}
        url={makeCollectivitePlansActionsImporterUrl({
          collectiviteId,
        })}
      />
    </div>
  );
};
