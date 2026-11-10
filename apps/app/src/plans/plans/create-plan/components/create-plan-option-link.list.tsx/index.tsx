'use client';
import { appLabels } from '@/app/labels/catalog';
import {
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterIaUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import { Event, useEventTracker } from '@tet/ui';
import { BetaLabel } from '@/app/ui/beta.label';
import { useAvailableAiImportProfiles } from '../../../import-plan/data/use-available-ai-import-profiles';
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
  return (
    <div data-test="choix-creation-plan" className="flex gap-4">
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
      {profiles.length > 0 ? (
        <Link
          dataTest="choix-creation-plan.importer-ia"
          title={<BetaLabel>{appLabels.importPlanIaTitre}</BetaLabel>}
          subTitle={appLabels.importPlanIaSousTitre}
          icon={<ImportPlanPicto />}
          url={makeCollectivitePlansActionsImporterIaUrl({
            collectiviteId,
          })}
          onClickCallback={() => {
            tracker(Event.plans.importPlan);
          }}
        />
      ) : (
        <Link
          title={appLabels.importerUnPlan}
          subTitle={appLabels.importPlanSupportSousTitre}
          icon={<ImportPlanPicto />}
          url={makeCollectivitePlansActionsImporterUrl({
            collectiviteId,
          })}
          onClickCallback={() => {
            tracker(Event.plans.importPlan);
          }}
        />
      )}
    </div>
  );
};
