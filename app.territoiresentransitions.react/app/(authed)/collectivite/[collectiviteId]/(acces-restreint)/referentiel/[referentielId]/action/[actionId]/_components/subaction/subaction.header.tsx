import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { SubActionStatutDropdown } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import Markdown from '@/app/ui/Markdown';
import { ActionTypeEnum } from '@/backend/referentiels/index-domain';
import { InfoTooltip } from '@/ui';

type Props = {
  subAction: ActionDefinitionSummary;
  shouldDisplayProgressBar: boolean;
};

const SubactionHeader = ({ subAction, shouldDisplayProgressBar }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Statut */}
      <SubActionStatutDropdown actionDefinition={subAction} />

      {/* Identifiant et nom de l'action + infos additionnelles */}
      <div className="text-primary-9 text-base font-bold">
        {subAction.identifiant} {subAction.nom}{' '}
        {subAction.description && subAction.referentiel === 'cae' && (
          <InfoTooltip
            label={
              <Markdown
                className="max-w-sm font-normal"
                content={subAction.description}
              />
            }
            activatedBy="click"
            iconClassName="ml-1"
          />
        )}
      </div>

      {/* Score réalisé */}
      {shouldDisplayProgressBar && (
        <div className="mt-auto flex gap-3 items-center justify-between">
          <ScoreProgressBar
            id={subAction.id}
            identifiant={subAction.identifiant}
            type={subAction.type}
            className="grow shrink"
            displayDoneValue={subAction.type === ActionTypeEnum.TACHE}
            valuePosition="right"
          />
          {subAction.type === ActionTypeEnum.SOUS_ACTION && (
            <div className="w-36 shrink-0 flex justify-end">
              <ScoreRatioBadge actionId={subAction.id} size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubactionHeader;
