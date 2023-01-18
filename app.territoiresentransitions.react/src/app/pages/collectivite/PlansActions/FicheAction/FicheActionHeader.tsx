import {Link, useParams} from 'react-router-dom';

import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionUrl,
} from 'app/paths';
import {TFicheAction} from './data/types/alias';
import FilAriane, {TFilArianeLink} from 'ui/shared/FilAriane';

type TFicheActionHeader = {fiche: TFicheAction};

const FicheActionHeader = ({fiche}: TFicheActionHeader) => {
  // Uniquement donné dans le cas où la fiche fait partie d'un plan d'action
  const {planUid} = useParams<{planUid: string}>();
  const filAriane: TFilArianeLink[] = [
    {
      path: makeCollectivitePlanActionUrl({
        collectiviteId: fiche.collectivite_id!,
        planActionUid: planUid,
      }),
      displayedName: "Plan d'action",
    },
    {
      displayedName: fiche.titre ?? '',
    },
  ];

  return (
    <div className="">
      <div className="py-6 flex justify-between">
        {/** Fil d'ariane */}
        <div className="flex items-center">
          {!fiche.axes ? (
            <Link
              className="p-1 underline text-xs text-gray-500 !shadow-none hover:text-gray-600"
              to={() =>
                makeCollectiviteFichesNonClasseesUrl({
                  collectiviteId: fiche.collectivite_id!,
                })
              }
            >
              Fiches non classées
            </Link>
          ) : (
            <FilAriane links={filAriane} />
          )}
        </div>
        {/** Actions */}
        {/* <div className="flex items-center gap-4">
          <div className="border border-gray-300">
            <button className="p-2">
              <div className="fr-fi-chat-quote-line" />
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default FicheActionHeader;
