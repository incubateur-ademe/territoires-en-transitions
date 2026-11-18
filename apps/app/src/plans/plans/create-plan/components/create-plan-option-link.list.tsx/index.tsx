'use client';
import { appLabels } from '@/app/labels/catalog';
import {
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
  makeCollectivitePlansActionsImporterIaUrl,
} from '@/app/app/paths';
import { Event, Icon, useEventTracker } from '@tet/ui';
import { BetaLabel } from '@/app/ui/beta.label';
import CreatePlanPicto from './create.svg';
import ImportPlanPicto from './import.svg';
import { Link } from './link';

export const CreatePlanOptionLinksList = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const tracker = useEventTracker();
  return (
    <div
      data-test="choix-creation-plan"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
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
      <Link
        dataTest="choix-creation-plan.importer-ia"
        title={<BetaLabel>{appLabels.importPlanIaChoixTitre}</BetaLabel>}
        subTitle={appLabels.importPlanIaTypesCompatiblesSousTitre}
        icon={<ImportPlanPicto />}
        url={makeCollectivitePlansActionsImporterIaUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.importPlan);
        }}
      />
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
