import { useCommentPanel } from '@/app/referentiels/actions/comments/hooks/use-comment-panel';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Discussion } from '@tet/domain/collectivites';
import { Divider } from '@tet/ui';
import classNames from 'classnames';
import SubActionCard from './subaction-card';

type Props = {
  parentAction: ActionListItem;
  sortedSubActions: {
    [categorie: string]: ActionListItem[];
  };
  showJustifications: boolean;
  isSubActionExpanded?: boolean;
  discussions: Discussion[];
};

export const SubActionCardsList = ({
  sortedSubActions,
  showJustifications,
  discussions,
  isSubActionExpanded = false,
}: Props) => {
  const { openCommentPanel } = useCommentPanel();

  return (
    <>
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
                        key={`${subAction.actionId}-${isSubActionExpanded}`}
                        subAction={subAction}
                        isOpen={isSubActionExpanded}
                        showJustifications={showJustifications}
                        openCommentPanel={openCommentPanel}
                        commentsCount={discussions.length}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
        )}
      </div>
    </>
  );
};
