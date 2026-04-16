'use client';

import { appLabels } from '@/app/labels/catalog';
import { ButtonMenu, Checkbox, cn } from '@tet/ui';
import {
  PLAN_DISPLAY_OPTIONS,
  PlanDisplayOption,
  PlanDisplayOptionsEnum,
  usePlanOptions,
} from './plan-options.context';

const OPTION_LABELS: Record<PlanDisplayOption, string> = {
  description: appLabels.description,
  indicateurs: appLabels.indicateurs,
  graphique_indicateurs: appLabels.planOptionGraphiqueIndicateurs,
  actions: appLabels.actions,
};

export const PlanOptionsButton = () => {
  const { toggleOption, isOptionEnabled } = usePlanOptions();

  return (
    <ButtonMenu
      dataTest="plan-options.button"
      size="sm"
      variant="outlined"
      icon="eye-line"
      withArrow
      menu={{
        className: 'min-w-72',
        startContent: (
          <div className="flex flex-col gap-3 p-2">
            {PLAN_DISPLAY_OPTIONS.map((option) => (
              <Checkbox
                key={option}
                label={OPTION_LABELS[option]}
                containerClassname={cn({
                  'ml-4':
                    option === PlanDisplayOptionsEnum.GRAPHIQUE_INDICATEURS,
                })}
                disabled={
                  option === PlanDisplayOptionsEnum.GRAPHIQUE_INDICATEURS &&
                  !isOptionEnabled(PlanDisplayOptionsEnum.INDICATEURS)
                }
                checked={isOptionEnabled(option)}
                onChange={() => toggleOption(option)}
              />
            ))}
          </div>
        ),
      }}
    >
      Affichage
    </ButtonMenu>
  );
};
