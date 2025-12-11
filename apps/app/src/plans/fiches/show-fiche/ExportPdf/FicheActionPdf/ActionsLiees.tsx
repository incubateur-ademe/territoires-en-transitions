import { referentielToName } from '@/app/app/labels';
import { ScoreProgressBar } from '../scores/score-progress-bar';
import { ScoreRatioBadge } from '../scores/score-ratio-badge';

import {
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { ActionWithScore } from '@tet/domain/referentiels';

type ActionLieeCardProps = {
  action: ActionWithScore;
};

const ActionLieeCard = ({ action }: ActionLieeCardProps) => {
  const { identifiant, nom, referentiel } = action;

  return (
    <Card wrap={false} gap={1} className="w-[49%] p-3">
      {/* Référentiel associé */}
      <Paragraph className="text-grey-8 font-medium">
        Référentiel {referentielToName[referentiel]}
      </Paragraph>
      {/* Nom de l'action */}
      <Title variant="h6" className="text-primary-8">
        {identifiant} {nom}
      </Title>

      <Stack
        direction="row"
        gap={2}
        className="items-center justify-between mt-auto"
      >
        {/* Barre de progression */}
        {action.score?.concerne && (
          <ScoreProgressBar score={action.score} className="w-2/3" />
        )}
        {/* Badge de score */}
        {action.score && <ScoreRatioBadge score={action.score} size="sm" />}
      </Stack>
    </Card>
  );
};

type ActionsLieesProps = {
  actionsLiees: ActionWithScore[];
};

const ActionsLiees = ({ actionsLiees }: ActionsLieesProps) => {
  if (actionsLiees.length === 0) return null;

  const firstActionsList = actionsLiees.slice(0, 2);
  const otherActionsList = actionsLiees.slice(2);

  return (
    <>
      <Divider className="mt-2" />

      <Stack gap={2.5}>
        <Stack wrap={false}>
          <Title variant="h5" className="text-primary-8 uppercase">
            Mesures des référentiels liées
          </Title>
          <Stack gap={2.5} direction="row" className="flex-wrap">
            {firstActionsList.map((action) => (
              <ActionLieeCard key={action.actionId} action={action} />
            ))}
          </Stack>
        </Stack>

        {otherActionsList.length > 0 && (
          <Stack gap={2.5} direction="row" className="flex-wrap">
            {otherActionsList.map((action) => (
              <ActionLieeCard key={action.actionId} action={action} />
            ))}
          </Stack>
        )}
      </Stack>
    </>
  );
};

export default ActionsLiees;
