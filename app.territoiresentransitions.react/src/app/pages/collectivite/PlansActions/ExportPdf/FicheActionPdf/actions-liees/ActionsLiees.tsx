import { avancementToLabel, referentielToName } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { ActionWithStatut } from '@/app/referentiels/actions/use-list-actions';
import {
  Badge,
  BadgeStatutAction,
  Box,
  Card,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { ActionWithStatutAndScore } from './types';

type ActionLieeCardProps = {
  action: ActionWithStatutAndScore;
};

const ActionLieeCard = ({ action }: ActionLieeCardProps) => {
  const { identifiant, nom, referentiel, statut, actionId } = action;

  const pointsFait = action.score.pointFait;
  const pointsPotentiel = action.score.pointPotentiel;

  const troncateIfZero = (value: string | undefined) => {
    if (!value) {
      return '0';
    }
    return value.endsWith('.0') ? value.slice(0, -2) : value;
  };

  const calculatePercentage = (
    pointFait: number | null,
    pointPotentiel: number | null
  ): string => {
    if (pointFait && pointPotentiel) {
      const percentage = ((pointFait / pointPotentiel) * 100).toFixed(1);
      return troncateIfZero(percentage);
    }
    return '0';
  };

  const roundPointFait = troncateIfZero(pointsFait?.toFixed(1));
  const roundPointPotentiel = troncateIfZero(pointsPotentiel?.toFixed(1));

  // Barre de score

  const score = [
    {
      label: avancementToLabel.fait,
      value: action.score.pointFait,
      color: actionAvancementColors.fait,
    },
    {
      label: avancementToLabel.programme,
      value: action.score.pointProgramme,
      color: actionAvancementColors.programme,
    },
    {
      label: avancementToLabel.pas_fait,
      value: action.score.pointPasFait,
      color: actionAvancementColors.pas_fait,
    },
  ];

  const percentageAgainstTotal = (x: number): number =>
    (100 * x) / (action.score.pointPotentiel || 1);

  const localData: { label: string; value: number; color: string }[] = [];
  score.forEach((s, idx) => {
    if (s.value === 0) {
      return localData.push({ ...s, value: 0 });
    }

    const value = s.value ? percentageAgainstTotal(s.value) : 0;

    localData.push({
      ...s,
      value: value + (idx >= 1 ? localData[idx - 1].value : 0),
    });
  });

  return (
    <Card wrap={false} gap={1.5} className="w-[32%] p-3">
      {/* Avancement */}
      <BadgeStatutAction statut={statut} size="sm" />

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
        <Stack direction="row" gap={0}>
          {false ? (
            <Badge title="0 point" state="grey" uppercase={false} />
          ) : (
            <>
              <Badge
                title={`${calculatePercentage(pointsFait, pointsPotentiel)} %`}
                state="success"
                uppercase={false}
                className="rounded-r-none border-2 border-r-0"
              />
              <Badge
                title={`${roundPointFait} / ${roundPointPotentiel} points`}
                state="success"
                light
                uppercase={false}
                className="rounded-l-none border-2"
              />
            </>
          )}
        </Stack>

        {/* Barre de progression */}
        <Stack
          className={classNames(
            'relative flex pt-1 min-w-[100px] min-h-[10px] w-full bg-gray-200 rounded-[4px]'
          )}
        >
          {localData
            .sort((a, b) => b.value - a.value) // Permet d'afficher les plus grandes barres en premières afin d'avoir un effet de stacking et ne pas utiliser de z-index
            .map((d) => (
              <Box
                key={d.label}
                className={classNames(
                  'absolute min-h-full top-0 left-0 rounded-[4px]',
                  `min-w-[${d.value}%]`,
                  `bg-[${d.color}]`
                )}
              />
            ))}
        </Stack>
      </Stack>
    </Card>
  );
};

type ActionsLieesProps = {
  actionsLiees: ActionWithStatutAndScore[];
};

const ActionsLiees = ({ actionsLiees }: ActionsLieesProps) => {
  if (actionsLiees.length === 0) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Actions des référentiels liées
      </Title>

      <Stack gap={3} direction="row" className="flex-wrap">
        {actionsLiees.map((action: any) => (
          <ActionLieeCard key={action.actionId} action={action} />
        ))}
      </Stack>
    </Card>
  );
};

export default ActionsLiees;
