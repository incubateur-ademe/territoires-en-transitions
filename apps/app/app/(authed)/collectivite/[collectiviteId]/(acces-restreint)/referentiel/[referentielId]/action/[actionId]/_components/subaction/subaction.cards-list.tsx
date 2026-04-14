import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Discussion } from '@tet/domain/collectivites';
import { Divider } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import SubActionCard from './subaction-card';
import { useHashFromUrl } from './use-hash-from-url';

type Props = {
  parentAction: ActionListItem;
  sortedSubActions: {
    [categorie: string]: ActionListItem[];
  };
  showJustifications: boolean;
  actionsAreAllExpanded?: boolean;
  discussions: Discussion[];
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
  discussions,
}: Props) => {
  const hash = useHashFromUrl();

  const defaultExpanded: DefaultExpanded | undefined = actionsAreAllExpanded
    ? { type: 'all' }
    : hash
    ? { type: 'action', actionId: hash }
    : undefined;
  const { isExpanded, toggle } = useExpandedSubActions(defaultExpanded);

  return (
    <div className="flex flex-col gap-7">
      {['bases', 'mise en œuvre', 'effets'].map(
        (categorie) =>
          sortedSubActions[categorie] && (
            <div key={categorie} className="flex flex-col">
              <h6 className="mb-0 text-sm">
                {phaseToLabel[categorie].toUpperCase()}
              </h6>
              <Divider className="mt-2 mb-6" />

              <div>
                <div className={classNames('grid gap-7')}>
                  {sortedSubActions[categorie].map((subAction) => (
                    <SubActionCard
                      key={subAction.actionId}
                      subAction={subAction}
                      isExpanded={isExpanded(subAction.actionId)}
                      onToggleExpanded={() => toggle(subAction.actionId)}
                      showJustifications={showJustifications}
                      commentsCount={
                        discussions.filter((d) =>
                          d.actionId.startsWith(subAction.actionId)
                        ).length
                      }
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
