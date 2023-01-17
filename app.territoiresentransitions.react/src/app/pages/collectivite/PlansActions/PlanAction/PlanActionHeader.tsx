import {TPlanAction} from './data/types/PlanAction';

type TPlanActionHeader = {
  plan: TPlanAction;
  collectivite_id: number;
};

const PlanActionHeader = ({collectivite_id, plan}: TPlanActionHeader) => {
  return (
    <div className="">
      <div className="py-6 flex justify-between">
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
