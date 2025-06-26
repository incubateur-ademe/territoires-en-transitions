import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { phaseToLabel } from '@/app/referentiels/utils';
import { Divider, SideMenu } from '@/ui';
import SubActionCard from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction-card';
import SubActionPanel from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/subaction/subaction.panel';
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

const SubActionCardsList = ({
  actionName,
  sortedSubActions,
  subActionsList,
  showJustifications,
}: Props) => {
  const [selectedSubactionIdx, setSelectedSubactionIdx] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleClick = (subActionId: string) => {
    setSelectedSubactionIdx(
      subActionsList.findIndex((s) => s.id === subActionId)
    );
    setIsPanelOpen((prevState) =>
      subActionsList[selectedSubactionIdx].id === subActionId
        ? !prevState
        : true
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
                          subAction.id ===
                            subActionsList[selectedSubactionIdx].id &&
                          isPanelOpen
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

      <SideMenu
        isOpen={isPanelOpen}
        setIsOpen={setIsPanelOpen}
        headerType="navigation"
        navigation={{
          prev:
            selectedSubactionIdx !== 0
              ? {
                  label: 'Sous-mesure précédente',
                  onClick: () =>
                    setSelectedSubactionIdx(selectedSubactionIdx - 1),
                }
              : undefined,
          next:
            selectedSubactionIdx !== subActionsList.length - 1
              ? {
                  label: 'Sous-mesure suivante',
                  onClick: () =>
                    setSelectedSubactionIdx(selectedSubactionIdx + 1),
                }
              : undefined,
        }}
      >
        <SubActionPanel subAction={subActionsList[selectedSubactionIdx]} />
      </SideMenu>
    </>
  );
};

export default SubActionCardsList;
