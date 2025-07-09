'use client';
import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import { Event, useEventTracker } from '@/ui';
import { ReactComponent as CreateWithActions } from './create-with-actions.svg';
import { ReactComponent as CreatePlanPicto } from './create.svg';
import { ReactComponent as ImportPlanPicto } from './import.svg';
import { Link } from './link';

export const CreatePlanOptionLinksList = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId: string | undefined;
}) => {
  const tracker = useEventTracker();
  return (
    <>
      <Link
        variant="primary"
        title="Créer un plan d’action"
        subTitle="directement sur la plateforme"
        icon={<CreatePlanPicto />}
        url={makeCollectivitePlansActionsCreerUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.createPlan);
        }}
      />
      <Link
        title="Importer un plan d’action"
        subTitle="à partir d’un modèle"
        icon={<ImportPlanPicto />}
        url={makeCollectivitePlansActionsImporterUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.importPlan);
        }}
      />
      <Link
        title="Initier votre plan d’action"
        subTitle="grâce aux “Actions à Impact”"
        icon={<CreateWithActions />}
        url={makeCollectivitePanierUrl({
          collectiviteId,
          panierId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.startPanier);
        }}
      />
    </>
  );
};
