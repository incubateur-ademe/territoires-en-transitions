import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {PlanNode} from './data/types';

type TPlanActionFooter = {
  plan: PlanNode;
  isReadonly: boolean;
};

const PlanActionFooter = ({plan, isReadonly}: TPlanActionFooter) => {
  return (
    <div className="flex flex-col gap-8 items-start pt-12">
      <ScrollTopButton />
    </div>
  );
};

export default PlanActionFooter;
