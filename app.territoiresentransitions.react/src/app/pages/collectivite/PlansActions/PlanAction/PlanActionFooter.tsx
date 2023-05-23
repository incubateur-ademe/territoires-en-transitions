import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {PlanNode} from './data/types';

type TPlanActionFooter = {
  plan: PlanNode;
  isReadonly: boolean;
};

const PlanActionFooter = ({plan, isReadonly}: TPlanActionFooter) => {
  return (
    <div className="py-12">
      <ScrollTopButton />
    </div>
  );
};

export default PlanActionFooter;
