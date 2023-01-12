import {makeCollectivitePlanActionUrl} from 'app/paths';
import {Link} from 'react-router-dom';

import {TPlanAction} from './data/types/PlanAction';

type TPlanActionHeader = {
  plan: TPlanAction;
  collectivite_id: number;
};

const PlanActionHeader = ({collectivite_id, plan}: TPlanActionHeader) => {
  return (
    <div className="">
      <div className="py-6 flex justify-between">
        <Link
          className="p-1 underline text-gray-500 !shadow-none hover:text-gray-600"
          to={() =>
            makeCollectivitePlanActionUrl({
              collectiviteId: collectivite_id,
              planActionUid: plan.id.toString(),
            })
          }
        >
          {plan.nom}
        </Link>
        {/** Actions */}
        {/* <div className="flex items-center gap-4">
          <div className="border border-gray-300">
            <button className="p-2">
              Modifier
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default PlanActionHeader;
