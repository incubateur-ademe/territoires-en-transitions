import classNames from 'classnames';

import Actions from './Actions';

import { CollectiviteNiveauAccess } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { generateTitle } from '../../FicheAction/data/utils';
import { PlanNode } from '../data/types';
import { usePlanType } from '../data/usePlanType';

type TPlanActionHeader = {
  plan: PlanNode;
  axe: PlanNode;
  axes: PlanNode[];
  isAxePage: boolean;
  axeHasFiches: boolean;
  collectivite: CollectiviteNiveauAccess;
};

const PlanActionHeader = ({
  collectivite,
  plan,
  axe,
  axes,
  isAxePage,
  axeHasFiches,
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
      {!collectivite.isReadOnly && (
        <Actions
          collectiviteId={collectivite.id}
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
