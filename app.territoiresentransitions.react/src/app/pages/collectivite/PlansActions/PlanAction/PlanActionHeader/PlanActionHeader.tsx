import classNames from 'classnames';

import Actions from './Actions';

import {PlanNode} from '../data/types';
import {generateTitle} from '../../FicheAction/data/utils';

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
  return (
    <div
      className={classNames(
        'flex items-center gap-12 mx-auto py-8 px-11 bg-primary',
        {
          'mb-8': !isAxePage,
        }
      )}
    >
      {/** Header titre */}
      <span
        className={classNames('text-[2rem] text-white font-bold leading-snug', {
          'text-[1.75rem]': isAxePage,
        })}
      >
        {generateTitle(axe.nom)}
      </span>
      {/** Actions */}
      {!isReadonly && (
        <Actions
          collectivite_id={collectivite_id}
          plan={plan}
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
