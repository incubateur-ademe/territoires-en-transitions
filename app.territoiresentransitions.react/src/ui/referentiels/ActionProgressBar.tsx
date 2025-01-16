import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import ProgressBarWithTooltip from '@/app/ui/score/ProgressBarWithTooltip';
import { ProgressBarStyleOptions } from '../score/ProgressBar';

export const ActionProgressBar = ({
  action,
  // remettre actionId au lieu de action une fois l'affichage des scores par % généralisé
  className,
  styleOptions,
}: {
  action: ActionDefinitionSummary;
  className?: string;
  styleOptions?: ProgressBarStyleOptions;
}) => {
  // const score = useActionScore(action.id);
  const score = {
    referentiel: 'cae',
    action_id: '1',
    fait_taches_avancement: 1,
    pas_concerne_taches_avancement: 2,
    pas_fait_taches_avancement: 3,
    programme_taches_avancement: 4,
    point_fait: 5,
    point_programme: 6,
    point_pas_fait: 7,
    point_non_renseigne: 8,
    point_potentiel: 9,
    point_potentiel_perso: 10,
    point_referentiel: 11,
    concerne: true,
    total_taches_count: 8,
    completed_taches_count: 9,
    desactive: false,
  };
  const isReglementaire = action.identifiant.split('.').includes('0');

  if (score === null || (score.point_potentiel < 1e-3 && !isReglementaire))
    return null;

  const progressScore = [
    {
      label: avancementToLabel.fait,
      value:
        action.type === 'tache' || isReglementaire
          ? score.fait_taches_avancement
          : score.point_fait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value:
        action.type === 'tache' || isReglementaire
          ? score.programme_taches_avancement
          : score.point_programme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value:
        action.type === 'tache' || isReglementaire
          ? score.pas_fait_taches_avancement
          : score.point_pas_fait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  return (
    <div data-test={`score-${score.action_id}`} className={className}>
      <ProgressBarWithTooltip
        score={progressScore}
        total={
          isReglementaire
            ? score.total_taches_count - score.pas_concerne_taches_avancement
            : score.point_potentiel
        }
        defaultScore={{
          label: avancementToLabel.non_renseigne,
          color: actionAvancementColors.non_renseigne,
        }}
        percent={action.type === 'tache'}
        styleOptions={styleOptions}
      />
    </div>
  );
};

export default ActionProgressBar;
