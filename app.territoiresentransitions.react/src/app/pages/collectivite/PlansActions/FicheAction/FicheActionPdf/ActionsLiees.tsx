import classNames from 'classnames';
import { avancementToLabel, referentielToName } from '@tet/app/labels';
import { TActionStatutsRow } from 'types/alias';
import { getActionStatut } from 'ui/referentiels/utils';
import { Card, Paragraph, Stack, Title } from 'ui/exportPdf/components';

type ActionLieeCardProps = {
  action: TActionStatutsRow;
};

const ActionLieeCard = ({ action }: ActionLieeCardProps) => {
  const { identifiant, nom, referentiel } = action;
  const statut = getActionStatut(action);

  return (
    <Card wrap={false} gap={1.5} className="w-[31%] p-3">
      {/* Avancement */}
      <Paragraph className={classNames('uppercase')}>
        {avancementToLabel[statut]}
      </Paragraph>

      <Stack gap={1}>
        {/* Référentiel associé */}
        <Paragraph className="text-[0.7rem] text-grey-8 font-medium">
          Référentiel {referentielToName[referentiel]}
        </Paragraph>

        {/* Nom de l'action */}
        <Title variant="h6" className="leading-5">
          {identifiant} {nom}
        </Title>
      </Stack>
    </Card>
  );
};

type ActionsLieesProps = {
  actionsLiees: TActionStatutsRow[];
};

const ActionsLiees = ({ actionsLiees }: ActionsLieesProps) => {
  if (actionsLiees.length === 0) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Actions des référentiels liées
      </Title>
      {actionsLiees.length > 0 && (
        <Stack direction="row" className="flex-wrap">
          {actionsLiees.map((action) => (
            <ActionLieeCard key={action.action_id} action={action} />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ActionsLiees;
