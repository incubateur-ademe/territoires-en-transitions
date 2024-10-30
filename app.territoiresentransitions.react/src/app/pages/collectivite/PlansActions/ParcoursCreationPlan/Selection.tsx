import {
  makeCollectivitePanierUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
} from 'app/paths';
import classNames from 'classnames';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { ReactComponent as DocumentAddPicto } from './document-add.svg';
import { ReactComponent as DocumentDownloadPicto } from './document-download.svg';
import { ReactComponent as ShoppingBasket } from './shopping-basket.svg';
import { TrackingPlan, useEventTracker } from '@tet/ui';
import { useNbActionsDansPanier } from '@tet/app/Layout/Header/AccesPanierAction';

const Selection = () => {
  const collectivite_id = useCollectiviteId();

  const { data: panier } = useNbActionsDansPanier(collectivite_id);

  return (
    <div className="max-w-5xl mx-auto flex flex-col grow py-12">
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
              collectiviteId: collectivite_id!,
            })}
            trackingId="cta_creer"
          />
          <SelectFlowButton
            dataTest="ImporterPlan"
            title="Importer un plan d’action"
            subTitle="à partir d’un modèle"
            icon={<DocumentDownloadPicto />}
            url={makeCollectivitePlansActionsImporterUrl({
              collectiviteId: collectivite_id!,
            })}
            trackingId="cta_importer"
          />
          <SelectFlowButton
            dataTest="InitierPlan"
            title="Initier votre plan d’action"
            subTitle="grâce au Panier d'Actions à Impact"
            icon={<ShoppingBasket className="my-3" />}
            url={makeCollectivitePanierUrl({
              collectiviteId: collectivite_id,
              panierId: panier?.panierId,
            })}
            trackingId="cta_commencer_pai"
          />
        </div>
      </div>
    </div>
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
  trackingId: keyof TrackingPlan['app/creer-plan']['events'];
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
  const trackEvent = useEventTracker('app/creer-plan');
  const collectivite_id = useCollectiviteId()!;

  return (
    <div
      className={classNames(
        'grow bg-white border border-gray-200 rounded-lg hover:bg-primary-0',
        { '!bg-primary hover:!bg-primary-6': isPrimary }
      )}
    >
      <a
        data-test={dataTest}
        className="flex flex-col w-full py-6 items-center text-center text-sm !bg-none"
        href={url}
        onClick={() => {
          trackEvent(trackingId, { collectivite_id });
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
      </a>
    </div>
  );
};
