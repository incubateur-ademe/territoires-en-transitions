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
import { useAiImportAccess } from '@/app/plans/plans/import-plan/data/use-ai-import-access';
import CreatePlanPicto from './create.svg';
import ImportPlanPicto from './import.svg';
import { Link } from './link';

export const CreatePlanOptionLinksList = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const tracker = useEventTracker();
  const { profiles, isEntryPointVisible } = useAiImportAccess();
  return (
    <div
      data-test="choix-creation-plan"
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', {
        'sm:grid-cols-3': isEntryPointVisible,
      })}
    >
      <Link
        variant="primary"
        title={appLabels.creerPlan}
        subTitle={appLabels.creerPlanSousTitre}
        icon={<CreatePlanPicto className="w-16 h-16" />}
        url={makeCollectivitePlansActionsCreerUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.createPlan);
        }}
      />
      {isEntryPointVisible ? (
        <Link
          dataTest="choix-creation-plan.importer-ia"
          title={<BetaLabel>{appLabels.importPlanIaChoixTitre}</BetaLabel>}
          subTitle={appLabels.importPlanIaTypesCompatiblesSousTitre(profiles)}
          icon={<ImportPlanPicto className="w-16 h-16" />}
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
        icon={<Icon icon="mail-send-line" className="w-16 h-16" />}
        url={makeCollectivitePlansActionsImporterUrl({
          collectiviteId,
        })}
      />
    </div>
  );
};
