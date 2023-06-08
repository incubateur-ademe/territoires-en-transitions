import {
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsImporterUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {Link, useHistory} from 'react-router-dom';

const Selection = () => {
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  const tracker = useFonctionTracker();

  return (
    <div className="max-w-3xl m-auto flex flex-col grow py-12">
      <div className="w-full mx-auto">
        <h3 className="mb-8">Ajouter un plan d’action</h3>
        <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-[#f6f6f6]">
          <h6>Vous souhaitez</h6>
          <div className="flex justify-between gap-6">
            <SelectFlowButton
              dataTest="ImporterPlan"
              title="Importer un plan d’action"
              subTitle="à partir d’un modèle"
              iconClass="fr-icon-upload-fill"
              url={makeCollectivitePlansActionsImporterUrl({
                collectiviteId: collectivite_id!,
              })}
            />
            <SelectFlowButton
              dataTest="CreerPlan"
              title="Créer un plan d’action"
              subTitle="suivez le guide, pas à pas"
              iconClass="fr-icon-edit-box-fill"
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
};

const SelectFlowButton = ({
  dataTest,
  url,
  iconClass,
  title,
  subTitle,
}: SelectFlowButtonProps) => (
  <div className="grow bg-white border border-gray-200 border-b-4 border-b-bf500 hover:bg-[#EEEEEE]">
    <Link
      data-test={dataTest}
      className="flex flex-col w-full p-6 text-center !bg-none"
      to={url}
    >
      <div
        className={`${iconClass} flex !w-20 !h-20 mx-auto mb-6 before:!h-8 before:!w-8 before:!m-auto text-bf500`}
      />
      <div className="mb-2 font-bold">{title}</div>
      <div className="text-gray-500">{subTitle}</div>
    </Link>
  </div>
);
