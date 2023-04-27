import {PlanNode} from './data/types';

type TPlanActionHeader = {
  plan: PlanNode;
  collectivite_id: number;
};

const PlanActionHeader = ({collectivite_id, plan}: TPlanActionHeader) => {
  return (
    <div className="">
      <div className="py-6 flex justify-between">
        {/** Actions */}
        <div className="flex items-center gap-4 ml-auto" />
      </div>
    </div>
  );
};

export default PlanActionHeader;
