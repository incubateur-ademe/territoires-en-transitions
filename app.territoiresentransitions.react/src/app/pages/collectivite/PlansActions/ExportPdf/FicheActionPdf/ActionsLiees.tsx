import { referentielToName } from '@/app/app/labels';
import { ActionWithStatut } from '@/app/referentiels/actions/use-list-actions';
import {
  Badge,
  BadgeStatutAction,
  Card,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';

type ActionLieeCardProps = {
  action: ActionWithStatut;
};

const ActionLieeCard = ({ action }: ActionLieeCardProps) => {
  const { identifiant, nom, referentiel, actionId } = action;

  return (
    <Card wrap={false} gap={1.5} className="w-[32%] p-3">
      {/* Avancement */}
      <BadgeStatutAction statut={action.statut} size="sm" />

      <Stack gap={1}>
        {/* Référentiel associé */}
        <Paragraph className="text-[0.7rem] text-grey-8 font-medium">
          Référentiel {referentielToName[referentiel]}
        </Paragraph>
        {/* Nom de l'action */}
        <Title variant="h6" className="leading-5 text-primary-8">
          {identifiant} {nom}
        </Title>
        {/* Score */}

        <Stack direction="row" gap={0}>
          {false ? (
            <Badge title="0 point" state="grey" uppercase={false} />
          ) : (
            <>
              <Badge
                title="0 %"
                state="success"
                uppercase={false}
                className="!rounded-r-none border-2 border-r-0"
              />
              <Badge
                title="10 / 100 points"
                state="success"
                light
                uppercase={false}
                className="!rounded-l-none border-2"
              />
            </>
          )}
        </Stack>
        {/* <Box className="w-full h-10 bg-primary-2"></Box> */}

        {/* <ScoreRatioBadge actionId={actionId} className={'mb-3'} /> */}
        {/* <ScoreProgressBar
          id={actionId}
          identifiant={identifiant}
          type={'action' as ActionType}
          className="w-full"
        /> */}
      </Stack>
    </Card>
  );
};

type ActionsLieesProps = {
  actionsLiees: ActionWithStatut[];
};

const ActionsLiees = ({ actionsLiees }: ActionsLieesProps) => {
  if (actionsLiees.length === 0) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Actions des référentiels liées
      </Title>
      {actionsLiees.length > 0 && (
        <Stack gap={3} direction="row" className="flex-wrap">
          {actionsLiees.map((action) => (
            <ActionLieeCard key={action.actionId} action={action} />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ActionsLiees;
