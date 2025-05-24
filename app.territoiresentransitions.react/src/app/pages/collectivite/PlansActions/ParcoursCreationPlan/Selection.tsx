import { useNbActionsDansPanier } from '@/app/app/Layout/Header/useNbActionsDansPanier';
import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Event, EventName, TrackPageView, useEventTracker } from '@/ui';
import classNames from 'classnames';
import { pick } from 'es-toolkit';
import Link from 'next/link';
import { ReactComponent as DocumentAddPicto } from './document-add.svg';
import { ReactComponent as DocumentDownloadPicto } from './document-download.svg';
import { ReactComponent as ShoppingBasket } from './shopping-basket.svg';

const Selection = () => {
  const collectivite = useCurrentCollectivite()!;

  const collectiviteId = collectivite.collectiviteId;

  const { data: panier } = useNbActionsDansPanier(collectiviteId);

  return (
    <>
      <TrackPageView
        pageName="app/creer-plan"
        properties={pick(collectivite, [
          'collectiviteId',
          'niveauAcces',
          'role',
        ])}
      />
      <div
        data-test="choix-creation-plan"
        className="max-w-5xl mx-auto flex flex-col grow py-12"
      >
        <div className="flex flex-col py-14 px-24 text-center bg-primary-0">
          <h3 className="mb-4">Créer un plan d’action</h3>
          <p className="text-lg text-grey-6">Vous souhaitez</p>
          <div className="flex justify-between gap-6 mt-4">
            <SelectFlowButton
              isPrimary
              dataTest="CreerPlan"
              title="Créer un plan d’action"
              subTitle="directement sur la plateforme"
              icon={<DocumentAddPicto />}
              url={makeCollectivitePlansActionsCreerUrl({
                collectiviteId,
              })}
              trackingId={Event.plans.createPlan}
            />
            <SelectFlowButton
              dataTest="ImporterPlan"
              title="Importer un plan d’action"
              subTitle="à partir d’un modèle"
              icon={<DocumentDownloadPicto />}
              url={makeCollectivitePlansActionsImporterUrl({
                collectiviteId,
              })}
              trackingId={Event.plans.importPlan}
            />
            <SelectFlowButton
              dataTest="InitierPlan"
              title="Initier votre plan d’action"
              subTitle="grâce aux “Actions à Impact”"
              icon={<ShoppingBasket className="my-3" />}
              url={makeCollectivitePanierUrl({
                collectiviteId,
                panierId: panier?.panierId,
              })}
              trackingId={Event.plans.startPanier}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Selection;

type SelectFlowButtonProps = {
  dataTest?: string;
  url: string;
  icon: React.JSX.Element;
  title: string;
  subTitle: string;
  isPrimary?: boolean;
  trackingId: EventName;
};

const SelectFlowButton = ({
  dataTest,
  url,
  icon,
  title,
  subTitle,
  isPrimary = false,
  trackingId,
}: SelectFlowButtonProps) => {
  const trackEvent = useEventTracker();

  return (
    <div
      className={classNames(
        'grow bg-white border border-gray-200 rounded-lg hover:bg-primary-0',
        { '!bg-primary hover:!bg-primary-6': isPrimary }
      )}
    >
      <Link
        data-test={dataTest}
        className="flex flex-col w-full py-6 items-center text-center text-sm !bg-none"
        href={url}
        onClick={() => {
          trackEvent(trackingId);
        }}
      >
        {icon}
        <div
          className={classNames('m-1 font-bold text-primary-8', {
            '!text-primary-0': isPrimary,
          })}
        >
          {title}
        </div>
        <div
          className={classNames('text-grey-7 text-xs', {
            '!text-grey-1': isPrimary,
          })}
        >
          {subTitle}
        </div>
      </Link>
    </div>
  );
};
