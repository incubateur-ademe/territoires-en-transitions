import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Divider } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import SubActionCard from './subaction-card';
import { useGetURLHash } from '@/app/utils/use-get-url-hash';
import { useScrollToHash } from './use-scroll-to-hash';

type Props = {
  sortedSubActions: {
    [id: string]: ActionDefinitionSummary[];
  };
  showJustifications: boolean;
  actionsAreAllExpanded?: boolean;
};

type DefaultExpanded = { type: 'all' } | { type: 'action'; actionId: string };

function useExpandedSubActions(defaultExpanded?: DefaultExpanded): {
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
} {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const defaultKey = defaultExpanded
    ? defaultExpanded.type === 'all'
      ? 'all'
      : defaultExpanded.actionId
    : '';
  const [prevKey, setPrevKey] = useState(defaultKey);

  if (prevKey !== defaultKey) {
    setPrevKey(defaultKey);
    setOverrides({});
  }

  const isExpanded = (id: string): boolean => {
    if (id in overrides) return overrides[id];
    if (!defaultExpanded) return false;
    if (defaultExpanded.type === 'all') return true;
    return defaultExpanded.actionId.startsWith(id);
  };

  const toggle = (id: string) => {
    setOverrides((prev) => ({ ...prev, [id]: !isExpanded(id) }));
  };

  return { isExpanded, toggle };
}

export const SubActionCardsList = ({
  sortedSubActions,
  showJustifications,
  actionsAreAllExpanded,
}: Props) => {
  const hash = useGetURLHash();
  useScrollToHash(hash);

  const defaultExpanded: DefaultExpanded | undefined = actionsAreAllExpanded
    ? { type: 'all' }
    : hash
      ? { type: 'action', actionId: hash }
      : undefined;
  const { isExpanded, toggle } = useExpandedSubActions(defaultExpanded);

  return (
    <div className="flex flex-col gap-7">
      {['bases', 'mise en œuvre', 'effets'].map(
        (phase) =>
          sortedSubActions[phase] && (
            <div key={phase} className="flex flex-col">
              <h6 className="mb-0 text-sm">
                {phaseToLabel[phase].toUpperCase()}
              </h6>
              <Divider className="mt-2 mb-6" />

              <div>
                <div className={classNames('grid gap-7')}>
                  {sortedSubActions[phase].map((subAction) => (
                    <SubActionCard
                      key={subAction.id}
                      subAction={subAction}
                      isExpanded={isExpanded(subAction.id)}
                      onToggleExpanded={() => toggle(subAction.id)}
                      showJustifications={showJustifications}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
      )}
    </div>
  );
};
