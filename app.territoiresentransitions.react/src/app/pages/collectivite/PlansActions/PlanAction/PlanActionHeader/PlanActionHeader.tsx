import classNames from 'classnames';

import Actions from './Actions';

import {PlanNode} from '../data/types';
import {generateTitle} from '../../FicheAction/data/utils';
import {usePlanType} from '../data/usePlanType';

type TPlanActionHeader = {
  collectivite_id: number;
  plan: PlanNode;
  axe: PlanNode;
  axes: PlanNode[];
  isAxePage: boolean;
  axeHasFiches: boolean;
  isReadonly?: boolean;
};

const PlanActionHeader = ({
  collectivite_id,
  plan,
  axe,
  axes,
  isAxePage,
  axeHasFiches,
  isReadonly,
}: TPlanActionHeader) => {
  const type = usePlanType(plan.id);

  return (
    <div
      className={classNames(
        'flex items-center gap-12 mx-auto py-8 px-11 bg-primary',
        {
          'mb-8': !isAxePage,
        }
      )}
    >
      <div className="flex flex-col gap-3 grow">
        {/** Header titre */}
        <span
          className={classNames(
            'text-[1.75rem] text-white font-bold leading-snug',
            {
              '!text-[1.5rem]': isAxePage,
            }
          )}
        >
          {generateTitle(axe.nom)}
        </span>
        {/** Type plan d'action */}
        {!isAxePage && type && (
          <span className="font-bold text-lg text-white">{type.type}</span>
        )}
      </div>
      {/** Actions */}
      {!isReadonly && (
        <Actions
          collectivite_id={collectivite_id}
          plan={plan}
          type={type}
          axe={axe}
          axes={axes}
          isAxePage={isAxePage}
          axeHasFiches={axeHasFiches}
        />
      )}
    </div>
  );
};

export default PlanActionHeader;
