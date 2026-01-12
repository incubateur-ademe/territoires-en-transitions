import { PlanNode } from '@tet/domain/plans';
import { Axe } from './axe';
import { useAxeContext } from './axe.context';

export const AxeSousAxes = () => {
  const { isOpen, sousAxes, providerProps } = useAxeContext();
  const { rootAxe, axes, collectivite } = providerProps;

  if (!isOpen || !sousAxes.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 mt-4 mb-2">
      {sousAxes.map((axe: PlanNode) => (
        <Axe
          key={axe.id}
          rootAxe={rootAxe}
          axe={axe}
          axes={axes}
          collectivite={collectivite}
        />
      ))}
    </div>
  );
};
