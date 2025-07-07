'use client';
import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import { Event, useEventTracker } from '@/ui';
import { ReactComponent as DocumentAddPicto } from './document-add.svg';
import { ReactComponent as DocumentDownloadPicto } from './document-download.svg';
import { Link } from './link';
import { ReactComponent as ShoppingBasket } from './shopping-basket.svg';

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
        isPrimary
        dataTest="CreerPlan"
        title="Créer un plan d’action"
        subTitle="directement sur la plateforme"
        icon={<DocumentAddPicto />}
        url={makeCollectivitePlansActionsCreerUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.createPlan);
        }}
      />
      <Link
        dataTest="ImporterPlan"
        title="Importer un plan d’action"
        subTitle="à partir d’un modèle"
        icon={<DocumentDownloadPicto />}
        url={makeCollectivitePlansActionsImporterUrl({
          collectiviteId,
        })}
        onClickCallback={() => {
          tracker(Event.plans.importPlan);
        }}
      />
      <Link
        dataTest="InitierPlan"
        title="Initier votre plan d’action"
        subTitle="grâce aux “Actions à Impact”"
        icon={<ShoppingBasket className="my-3" />}
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
