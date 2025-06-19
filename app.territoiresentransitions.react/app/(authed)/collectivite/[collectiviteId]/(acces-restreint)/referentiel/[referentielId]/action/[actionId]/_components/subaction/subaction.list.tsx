import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Divider, SideMenu } from '@/ui';
import SubActionCard from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.card';
import SubActionContent from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.content';
import classNames from 'classnames';
import { useState } from 'react';

type Props = {
  actionName: string;
  sortedSubActions: {
    [id: string]: ActionDefinitionSummary[];
  };
  subActionsList: ActionDefinitionSummary[];
  showJustifications: boolean;
};

const SubActionsList = ({
  actionName,
  sortedSubActions,
  subActionsList,
  showJustifications,
}: Props) => {
  const [selectedSubaction, setSelectedSubaction] = useState(
    subActionsList[0].id
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const getDisplayedSubaction = (id: string) => {
    return subActionsList.find((s) => s.id === id) ?? subActionsList[0];
  };

  const handleClick = (subActionId: string) => {
    setSelectedSubaction(subActionId);
    setIsPanelOpen((prevState) =>
      selectedSubaction === subActionId ? !prevState : true
    );
  };

  return (
    <>
      <div className="flex flex-col gap-7">
        {['bases', 'mise en œuvre', 'effets'].map(
          (phase) =>
            sortedSubActions[phase] && (
              <div key={phase} className="flex flex-col">
                <h6 className="mb-0 text-sm">
                  {phaseToLabel[phase].toUpperCase()}
                </h6>
                <Divider color="light" className="mt-2" />

                <div>
                  <div
                    className={classNames('grid gap-7', {
                      'md:grid-cols-2 lg:grid-cols-3': !showJustifications,
                    })}
                  >
                    {sortedSubActions[phase].map((subAction) => (
                      <SubActionCard
                        key={subAction.id}
                        subAction={subAction}
                        isOpen={
                          subAction.id === selectedSubaction && isPanelOpen
                        }
                        showJustifications={showJustifications}
                        onClick={() => {
                          handleClick(subAction.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
        )}
      </div>

      <SideMenu isOpen={isPanelOpen} setIsOpen={setIsPanelOpen}>
        <SubActionContent
          actionName={actionName}
          subAction={getDisplayedSubaction(selectedSubaction)}
        />
      </SideMenu>
    </>
  );
};

export default SubActionsList;
