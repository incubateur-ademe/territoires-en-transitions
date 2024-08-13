import {
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
} from 'app/paths';
import classNames from 'classnames';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import Link from 'next/link';
import {useHistory} from 'react-router-dom';

const Selection = () => {
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  const tracker = useFonctionTracker();

  return (
    <div className="max-w-3xl mx-auto flex flex-col grow py-12">
      <div className="w-full mx-auto">
        <div className="flex flex-col mt-2 mb-10 py-14 px-24 text-center bg-primary-0">
          <h3 className="mb-4">Ajouter un plan d’action</h3>
          <p className="text-lg text-grey-6">Vous souhaitez</p>
          <div className="flex justify-between gap-6 mt-4">
            <SelectFlowButton
              dataTest="ImporterPlan"
              title="Importer un plan d’action"
              subTitle="à partir d’un modèle"
              iconClass="fr-icon-file-add-line"
              url={makeCollectivitePlansActionsImporterUrl({
                collectiviteId: collectivite_id!,
              })}
            />
            <SelectFlowButton
              isPrimary
              dataTest="CreerPlan"
              title="Créer un plan d’action"
              subTitle="suivez le guide, pas à pas"
              iconClass="fr-icon-draft-line"
              url={makeCollectivitePlansActionsCreerUrl({
                collectiviteId: collectivite_id!,
              })}
            />
          </div>
          <button
            className="fr-btn fr-btn--tertiary mt-10 ml-auto"
            onClick={() => {
              history.goBack();
              tracker({fonction: 'annulation', action: 'clic'});
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default Selection;

type SelectFlowButtonProps = {
  dataTest?: string;
  url: string;
  iconClass: string;
  title: string;
  subTitle: string;
  isPrimary?: boolean;
};

const SelectFlowButton = ({
  dataTest,
  url,
  iconClass,
  title,
  subTitle,
  isPrimary = false,
}: SelectFlowButtonProps) => (
  <div
    className={classNames(
      'grow bg-white border border-gray-200 rounded-lg hover:bg-primary-0',
      {'!bg-primary hover:!bg-primary-6': isPrimary}
    )}
  >
    <Link
      data-test={dataTest}
      className="flex flex-col w-full p-6 text-center !bg-none"
      href={url}
    >
      <div
        className={`${iconClass} flex !w-20 !h-20 mx-auto mt-3 mb-6 before:!h-16 before:!w-16 before:!m-auto text-primary-4`}
      />
      <div
        className={classNames('m-1 font-bold text-primary-8', {
          '!text-primary-0': isPrimary,
        })}
      >
        {title}
      </div>
      <div className={classNames('text-grey-7', {'!text-grey-1': isPrimary})}>
        {subTitle}
      </div>
    </Link>
  </div>
);
