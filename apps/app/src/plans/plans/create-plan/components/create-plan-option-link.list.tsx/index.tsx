'use client';
import { appLabels } from '@/app/labels/catalog';
import {
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterIaUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import { Event, useEventTracker } from '@tet/ui';
import { AiImportBetaLabel } from '../../../import-plan/ai-import-beta-label';
import { useIsAiPlanImportEnabled } from '../../../import-plan/use-is-ai-plan-import-enabled';
import CreatePlanPicto from './create.svg';
import ImportPlanPicto from './import.svg';
import { Link } from './link';

export const CreatePlanOptionLinksList = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const tracker = useEventTracker();
  const isAiPlanImportEnabled = useIsAiPlanImportEnabled();
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
      {isAiPlanImportEnabled ? (
        <Link
          dataTest="choix-creation-plan.importer-ia"
          title={
            <AiImportBetaLabel>{appLabels.importPlanIaTitre}</AiImportBetaLabel>
          }
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
          subTitle={appLabels.importPlanModeleSousTitre}
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
