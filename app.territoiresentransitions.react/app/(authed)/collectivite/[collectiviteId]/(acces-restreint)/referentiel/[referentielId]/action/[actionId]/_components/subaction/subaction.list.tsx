import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import SubActionCard from '@/app/referentiels/actions/sub-action/sub-action.card';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Divider, SideMenu } from '@/ui';
import SubActionContent from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.content';
import { useState } from 'react';

type Props = {
  sortedSubActions: {
    [id: string]: ActionDefinitionSummary[];
  };
  subActionsList: ActionDefinitionSummary[];
};

const SubActionsList = ({ sortedSubActions, subActionsList }: Props) => {
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

                <div className="flex flex-col gap-7">
                  {sortedSubActions[phase].map((subAction) => (
                    <SubActionCard
                      key={subAction.id}
                      subAction={subAction}
                      isOpen={subAction.id === selectedSubaction && isPanelOpen}
                      onClick={() => {
                        handleClick(subAction.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            )
        )}
      </div>

      <SideMenu isOpen={isPanelOpen} setIsOpen={setIsPanelOpen}>
        <SubActionContent
          subAction={getDisplayedSubaction(selectedSubaction)}
        />
      </SideMenu>
    </>
  );
};

export default SubActionsList;
