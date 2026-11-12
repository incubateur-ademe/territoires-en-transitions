'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { Button } from '@tet/ui';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { useCallback, useEffect } from 'react';
import { RenseignerAvancementPanel } from './renseigner-avancement.panel';

type Props = { collectiviteId: number; planId: number };

const useIsRenseignerAvancementOuvert = () =>
  useQueryState('renseignerAvancement', parseAsBoolean.withDefault(false));

const renseignerAvancementPanel = ({ collectiviteId, planId }: Props) =>
  ({
    type: 'open',
    title: appLabels.faireAvancerLePlanRenseignerAvancement,
    content: (
      <RenseignerAvancementPanel
        collectiviteId={collectiviteId}
        planId={planId}
      />
    ),
  } as const);

export const RenseignerAvancementButton = ({
  collectiviteId,
  planId,
  dataTest,
}: Props & { dataTest?: string }) => {
  const [, setIsOuvert] = useIsRenseignerAvancementOuvert();
  const { setPanel } = useSidePanel();

  return (
    <Button
      variant="outlined"
      size="xs"
      className="gap-2 bg-white whitespace-nowrap"
      icon="side-bar-line"
      iconPosition="right"
      onClick={() => {
        setIsOuvert(true);
        setPanel(renseignerAvancementPanel({ collectiviteId, planId }));
      }}
      dataTest={dataTest}
    >
      {appLabels.faireAvancerLePlanRenseignerAvancement}
    </Button>
  );
};

export const RenseignerAvancementSidePanel = ({
  collectiviteId,
  planId,
}: Props) => {
  const [isOuvert, setIsOuvert] = useIsRenseignerAvancementOuvert();
  const onClose = useCallback(() => setIsOuvert(null), [setIsOuvert]);
  const { setPanel } = useSidePanel({ onClose });

  useEffect(() => {
    if (isOuvert) {
      setPanel(renseignerAvancementPanel({ collectiviteId, planId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
