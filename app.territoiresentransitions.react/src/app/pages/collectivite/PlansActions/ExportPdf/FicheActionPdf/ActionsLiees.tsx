import { referentielToName } from '@/app/app/labels';
import { ScoreProgressBar } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/scores/score-progress-bar';
import { ScoreRatioBadge } from '@/app/app/pages/collectivite/PlansActions/ExportPdf/scores/score-ratio-badge';

import {
  BadgeStatutAction,
  Card,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { ActionWithScore } from '@/domain/referentiels';

type ActionLieeCardProps = {
  action: ActionWithScore;
};

const ActionLieeCard = ({ action }: ActionLieeCardProps) => {
  const { identifiant, nom, referentiel, statut } = action;

  return (
    <Card wrap={false} gap={1.5} className="w-[32%] p-3">
      {/* Avancement */}
      {statut && <BadgeStatutAction statut={statut} size="sm" />}

      <Stack gap={1}>
        {/* Référentiel associé */}
        <Paragraph className="text-[0.7rem] text-grey-8 font-medium">
          Référentiel {referentielToName[referentiel]}
        </Paragraph>
        {/* Nom de l'action */}
        <Title variant="h6" className="leading-5 text-primary-8">
          {identifiant} {nom}
        </Title>
        {/* Badge de score */}
        {action.score && <ScoreRatioBadge score={action.score} />}
        {/* Barre de progression */}
        {action.score && <ScoreProgressBar score={action.score} />}
      </Stack>
    </Card>
  );
};

type ActionsLieesProps = {
  actionsLiees: ActionWithScore[];
};

const ActionsLiees = ({ actionsLiees }: ActionsLieesProps) => {
  if (actionsLiees.length === 0) return null;

  return (
    <Card>
      <Title variant="h4" className="text-primary-8">
        Mesures des référentiels liées
      </Title>

      <Stack gap={3} direction="row" className="flex-wrap">
        {actionsLiees.map((action) => (
          <ActionLieeCard key={action.actionId} action={action} />
        ))}
      </Stack>
    </Card>
  );
};

export default ActionsLiees;
